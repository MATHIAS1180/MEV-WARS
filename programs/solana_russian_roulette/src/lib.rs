use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::hash::hash;
use std::str::FromStr;

declare_id!("88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd");

// No MAX_PLAYERS cap — unlimited searchers per block
pub const MAX_PLAYERS: usize = 30;
pub const TREASURY_PUBKEY: &str = "FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt";

#[program]
pub mod solana_russian_roulette {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>, room_id: u8, entry_fee: u64) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.room_id = room_id;
        game.entry_fee = entry_fee;
        game.player_count = 0;
        game.state = GameState::Waiting;
        game.pot_amount = 0;
        game.resolve_slot = 0;
        game.last_activity_time = Clock::get()?.unix_timestamp;
        game.block_start_time = 0; // not started yet

        for i in 0..MAX_PLAYERS {
            game.players[i] = Pubkey::default();
        }

        game.bump = ctx.bumps.game;
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(game.state == GameState::Waiting, ErrorCode::GameNotInWaitingState);

        let current_player_count = game.player_count as usize;

        for i in 0..current_player_count {
            require!(game.players[i] != player.key(), ErrorCode::PlayerAlreadyJoined);
        }

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: player.to_account_info(),
                to: game.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, game.entry_fee)?;

        game.players[current_player_count] = player.key();
        game.player_count += 1;
        game.pot_amount += game.entry_fee;

        let clock = Clock::get()?;

        // Start block timer on first searcher joining
        if game.player_count == 1 {
            game.last_activity_time = clock.unix_timestamp;
            game.block_start_time = clock.unix_timestamp;
            game.resolve_slot = clock.slot;
        }

        emit!(PlayerJoinedEvent {
            game: game.key(),
            player: player.key(),
            player_index: current_player_count as u8,
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Settle the block. Can be triggered:
    ///   - when current_slot > entry_slot (PRNG via future block hash is safe)
    ///   - by the crank when 30s elapsed OR a multiple of 3 players is reached
    pub fn settle_winner(ctx: Context<SettleWinner>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;

        require!(game.state == GameState::Waiting, ErrorCode::GameNotInWaitingState);

        let clock = Clock::get()?;
        // Guarantee the block hash was unknowable at deposit time
        require!(clock.slot > game.resolve_slot, ErrorCode::DrawTooEarly);

        let player_count = game.player_count as usize;

        if player_count < 3 {
            // BLOC REJETÉ — refund 100% to all searchers
            let refund_amount = game.entry_fee;
            for i in 0..player_count {
                let player_pubkey = game.players[i];
                if let Some(account) = ctx.remaining_accounts.iter().find(|a| a.key() == player_pubkey) {
                    **game.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
                    **account.try_borrow_mut_lamports()? += refund_amount;
                }
            }

            emit!(GameRefundedEvent { game: game.key() });

            // Reset block
            game.player_count = 0;
            game.pot_amount = 0;
            game.block_start_time = 0;
            for i in 0..MAX_PLAYERS {
                game.players[i] = Pubkey::default();
            }
            game.last_activity_time = clock.unix_timestamp;
            game.resolve_slot = 0;
            return Ok(());
        }

        // 1 winner per 3 searchers
        let num_winners = player_count / 3;

        let treasury_key = Pubkey::from_str(TREASURY_PUBKEY).unwrap();
        let treasury_account = ctx.remaining_accounts
            .iter()
            .find(|a| a.key() == treasury_key)
            .ok_or(ErrorCode::InvalidTreasury)?;

        // PRNG seed: future slot hash + timestamp + all player pubkeys
        // The slot is guaranteed to be > entry_slot so the hash was unknown at deposit time
        let mut seed_data = Vec::new();
        seed_data.extend_from_slice(&clock.slot.to_le_bytes());
        seed_data.extend_from_slice(&clock.unix_timestamp.to_le_bytes());
        for i in 0..player_count {
            seed_data.extend_from_slice(game.players[i].as_ref());
        }

        let mut available_indices: Vec<usize> = (0..player_count).collect();
        let mut winners_indices = Vec::new();

        for w in 0..num_winners {
            let mut reseed = seed_data.clone();
            reseed.extend_from_slice(&[w as u8]);
            let random_hash = hash(&reseed).to_bytes();

            let mut rand_slice = [0u8; 8];
            rand_slice.copy_from_slice(&random_hash[0..8]);
            let rand_val = u64::from_le_bytes(rand_slice);

            let idx = (rand_val % available_indices.len() as u64) as usize;
            winners_indices.push(available_indices[idx]);
            available_indices.remove(idx);
        }

        let total_pot = game.pot_amount;
        // 5% treasury / 95% winners pool
        let house_cut = total_pot * 5 / 100;
        let reward_pool = total_pot - house_cut;
        let cut_per_winner = reward_pool / num_winners as u64;

        **game.to_account_info().try_borrow_mut_lamports()? -= house_cut;
        **treasury_account.try_borrow_mut_lamports()? += house_cut;

        for w_idx in &winners_indices {
            let w_pub = game.players[*w_idx];
            let w_acc = ctx.remaining_accounts
                .iter()
                .find(|a| a.key() == w_pub)
                .ok_or(ErrorCode::PlayerNotInGame)?;

            **game.to_account_info().try_borrow_mut_lamports()? -= cut_per_winner;
            **w_acc.try_borrow_mut_lamports()? += cut_per_winner;

            emit!(WinnerExtractedEvent {
                game: game.key(),
                winner: w_pub,
                amount: cut_per_winner,
            });
        }

        emit!(GameSettledEvent {
            game: game.key(),
            total_pot,
            winners_count: num_winners as u8,
        });

        // Reset block
        game.player_count = 0;
        game.pot_amount = 0;
        game.resolve_slot = 0;
        game.block_start_time = 0;
        for i in 0..MAX_PLAYERS {
            game.players[i] = Pubkey::default();
        }
        game.last_activity_time = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(room_id: u8, entry_fee: u64)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Game::MAX_SIZE,
        seeds = [b"room".as_ref(), &[room_id]],
        bump
    )]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        seeds = [b"room".as_ref(), &[room_id]],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct SettleWinner<'info> {
    #[account(
        mut,
        seeds = [b"room".as_ref(), &[room_id]],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,
}

#[account]
pub struct Game {
    pub room_id: u8,
    pub entry_fee: u64,
    pub players: [Pubkey; MAX_PLAYERS],
    pub player_count: u8,
    pub state: GameState,
    pub pot_amount: u64,
    pub resolve_slot: u64,
    pub last_activity_time: i64,
    pub block_start_time: i64, // timestamp when first searcher joined
    pub bump: u8,
}

impl Game {
    pub const MAX_SIZE: usize =
        1 +                    // room_id
        8 +                    // entry_fee
        (32 * MAX_PLAYERS) +   // players
        1 +                    // player_count
        1 +                    // state
        8 +                    // pot_amount
        8 +                    // resolve_slot
        8 +                    // last_activity_time
        8 +                    // block_start_time
        1;                     // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Waiting,
}

#[event]
pub struct PlayerJoinedEvent {
    pub game: Pubkey,
    pub player: Pubkey,
    pub player_index: u8,
    pub player_count: u8,
}

#[event]
pub struct GameRefundedEvent {
    pub game: Pubkey,
}

#[event]
pub struct GameSettledEvent {
    pub game: Pubkey,
    pub total_pot: u64,
    pub winners_count: u8,
}

#[event]
pub struct WinnerExtractedEvent {
    pub game: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The game is not in waiting state.")]
    GameNotInWaitingState,
    #[msg("You have already joined this game.")]
    PlayerAlreadyJoined,
    #[msg("You are not in this game.")]
    PlayerNotInGame,
    #[msg("Draw too early. Settle winner block must be > last join block.")]
    DrawTooEarly,
    #[msg("Invalid treasury address.")]
    InvalidTreasury,
}
