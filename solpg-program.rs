use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::hash::hash;
use std::str::FromStr;

declare_id!("7kw5LM3xMyr51Zpsgznh64pNcucoodFkcnJztRfHBLJj");

pub const MAX_PLAYERS: usize = 30;
pub const TREASURY_PUBKEY: &str = "FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt";
pub const ROUND_EXPIRATION_SECONDS: i64 = 20;
pub const GAME_STATE_MAX_SIZE: usize =
    1 +                    // enum discriminant
    1 +                    // round (u8) for InProgress
    4 +                    // vec length prefix
    (32 * MAX_PLAYERS);    // survivors vec max content

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
        game.block_start_time = 0;
        game.current_round = 0;

        for i in 0..MAX_PLAYERS {
            game.players[i] = Pubkey::default();
            game.survivors[i] = Pubkey::default();
        }

        game.bump = ctx.bumps.game;
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(game.state == GameState::Waiting, ErrorCode::GameNotInWaitingState);

        let current_player_count = game.player_count as usize;
        require!(current_player_count < MAX_PLAYERS, ErrorCode::RoomFull);

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

        if game.player_count == 1 {
            game.last_activity_time = clock.unix_timestamp;
            game.block_start_time = clock.unix_timestamp;
            game.resolve_slot = clock.slot;
        } else if game.player_count == 2 {
            // Démarrer le jeu dès 2 joueurs
            game.state = GameState::InProgress { round: 1, survivors: game.players[0..game.player_count as usize].to_vec() };
            game.current_round = 1;
            for i in 0..game.player_count as usize {
                game.survivors[i] = game.players[i];
            }
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

    /// Refund all players if timer expired and <2 players
    pub fn refund_expired_game(ctx: Context<RefundExpiredGame>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        require!(game.state == GameState::Waiting, ErrorCode::GameNotInWaitingState);
        require!(game.player_count > 0, ErrorCode::GameEmpty);
        require!(game.player_count < 2, ErrorCode::TooManyPlayers);

        // Check if expiration time has passed since first player joined
        let elapsed = clock.unix_timestamp - game.block_start_time;
        require!(elapsed >= ROUND_EXPIRATION_SECONDS, ErrorCode::TimerNotExpired);

        let player_count = game.player_count as usize;
        let refund_amount = game.entry_fee;

        // Refund all players
        for i in 0..player_count {
            let player_pubkey = game.players[i];
            if let Some(account) = ctx.remaining_accounts.iter().find(|a| a.key() == player_pubkey) {
                **game.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
                **account.try_borrow_mut_lamports()? += refund_amount;
            }
        }

        emit!(GameRefundedEvent { game: game.key() });

        // Reset game
        game.player_count = 0;
        game.pot_amount = 0;
        game.block_start_time = 0;
        game.current_round = 0;
        for i in 0..MAX_PLAYERS {
            game.players[i] = Pubkey::default();
            game.survivors[i] = Pubkey::default();
        }
        game.last_activity_time = clock.unix_timestamp;
        game.resolve_slot = 0;

        Ok(())
    }

    /// Advance to next round or settle winner
    pub fn advance_round(ctx: Context<AdvanceRound>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;

        let clock = Clock::get()?;
        require!(clock.slot > game.resolve_slot, ErrorCode::DrawTooEarly);
        
        let elapsed = clock.unix_timestamp - game.block_start_time;
        require!(elapsed >= ROUND_EXPIRATION_SECONDS, ErrorCode::TimerNotExpired);

        // Clone the state to avoid borrow checker issues
        let current_state = game.state.clone();

        match current_state {
            GameState::InProgress { round, survivors } => {
                let survivor_count = survivors.len();
                if survivor_count <= 1 {
                    return err!(ErrorCode::GameAlreadyFinished);
                }

                // Calculate eliminations: 10% of survivors, min 1
                let eliminations = std::cmp::max(1, survivor_count / 10);

                // Eliminate players using on-chain randomness
                let mut seed_data = Vec::new();
                seed_data.extend_from_slice(&clock.slot.to_le_bytes());
                seed_data.extend_from_slice(&clock.unix_timestamp.to_le_bytes());
                seed_data.extend_from_slice(&[round]);
                for s in &survivors {
                    seed_data.extend_from_slice(s.as_ref());
                }

                let mut available_indices: Vec<usize> = (0..survivor_count).collect();
                let mut eliminated = Vec::new();

                for _ in 0..eliminations {
                    let random_hash = hash(&seed_data).to_bytes();
                    let mut rand_slice = [0u8; 8];
                    rand_slice.copy_from_slice(&random_hash[0..8]);
                    let rand_val = u64::from_le_bytes(rand_slice);

                    let idx = (rand_val % available_indices.len() as u64) as usize;
                    eliminated.push(survivors[available_indices[idx]]);
                    available_indices.remove(idx);

                    // Reseed for next elimination
                    seed_data.extend_from_slice(&[eliminated.len() as u8]);
                }

                // New survivors after elimination
                let new_survivors: Vec<Pubkey> = available_indices.iter().map(|&i| survivors[i]).collect();

                // Emit elimination events
                for elim in &eliminated {
                    emit!(PlayerEliminatedEvent {
                        game: game.key(),
                        player: *elim,
                        round,
                    });
                }

                if new_survivors.len() <= 1 {
                    // Last survivor wins
                    let winner = new_survivors[0];
                    let treasury_key = Pubkey::from_str(TREASURY_PUBKEY).unwrap();
                    let treasury_account = ctx.remaining_accounts
                        .iter()
                        .find(|a| a.key() == treasury_key)
                        .ok_or(ErrorCode::InvalidTreasury)?;

                    let total_pot = game.pot_amount;
                    let house_cut = total_pot * 2 / 100; // 2% house edge
                    let winner_amount = total_pot - house_cut;

                    **game.to_account_info().try_borrow_mut_lamports()? -= house_cut;
                    **treasury_account.try_borrow_mut_lamports()? += house_cut;

                    let winner_acc = ctx.remaining_accounts
                        .iter()
                        .find(|a| a.key() == winner)
                        .ok_or(ErrorCode::PlayerNotInGame)?;

                    **game.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
                    **winner_acc.try_borrow_mut_lamports()? += winner_amount;

                    emit!(WinnerExtractedEvent {
                        game: game.key(),
                        winner,
                        amount: winner_amount,
                    });

                    emit!(GameSettledEvent {
                        game: game.key(),
                        total_pot,
                        winners_count: 1,
                    });

                    game.state = GameState::Finished;
                    // Reset for next game
                    game.player_count = 0;
                    game.pot_amount = 0;
                    game.current_round = 0;
                    game.block_start_time = 0;
                    for i in 0..MAX_PLAYERS {
                        game.players[i] = Pubkey::default();
                        game.survivors[i] = Pubkey::default();
                    }
                } else {
                    for surv in &new_survivors {
                        emit!(SurvivorEvent {
                            game: game.key(),
                            player: *surv,
                            round: round + 1,
                        });
                    }

                    emit!(RoundAdvancedEvent {
                        game: game.key(),
                        round: round + 1,
                        survivors_count: new_survivors.len() as u8,
                        eliminated_count: eliminated.len() as u8,
                    });

                    // Update game state
                    game.state = GameState::InProgress { round: round + 1, survivors: new_survivors.clone() };
                    game.current_round = round + 1;
                    for i in 0..MAX_PLAYERS {
                        game.survivors[i] = if i < new_survivors.len() { new_survivors[i] } else { Pubkey::default() };
                    }
                    game.last_activity_time = clock.unix_timestamp;
                    game.block_start_time = clock.unix_timestamp;
                    game.resolve_slot = clock.slot;
                }
            },
            _ => return err!(ErrorCode::GameNotInProgress),
        }

        Ok(())
    }

    /// Allow a player to secure 2x gain and exit if multiplier >=2
    pub fn secure_gain(ctx: Context<SecureGain>, room_id: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        // Clone the state to avoid borrow checker issues
        let current_state = game.state.clone();

        match current_state {
            GameState::InProgress { round, survivors } => {
                require!(round >= 1, ErrorCode::CannotSecureBeforeRound1); // At least one round passed
                let multiplier = round as u64; // Round 1 = x1, but since after round, it's round+1? Wait, adjust
                // Actually, multiplier = current_round, and since round starts at 1, after round 1, multiplier=2
                require!(multiplier >= 2, ErrorCode::MultiplierTooLow);

                // Check if player is a survivor
                let survivor_index = survivors.iter().position(|&p| p == player.key());
                require!(survivor_index.is_some(), ErrorCode::PlayerNotSurvivor);

                let secure_amount = game.entry_fee * 2;
                require!(game.pot_amount >= secure_amount, ErrorCode::InsufficientPot);

                // Pay the player
                **game.to_account_info().try_borrow_mut_lamports()? -= secure_amount;
                **player.to_account_info().try_borrow_mut_lamports()? += secure_amount;
                game.pot_amount -= secure_amount;

                // Remove from survivors
                let mut new_survivors = survivors.clone();
                new_survivors.remove(survivor_index.unwrap());

                emit!(PlayerSecuredEvent {
                    game: game.key(),
                    player: player.key(),
                    amount: secure_amount,
                    round,
                });

                if new_survivors.len() <= 1 {
                    // If only one left or none, end game
                    if new_survivors.len() == 1 {
                        let winner = new_survivors[0];
                        let treasury_key = Pubkey::from_str(TREASURY_PUBKEY).unwrap();
                        let treasury_account = ctx.remaining_accounts
                            .iter()
                            .find(|a| a.key() == treasury_key)
                            .ok_or(ErrorCode::InvalidTreasury)?;

                        let total_pot = game.pot_amount;
                        let house_cut = total_pot * 2 / 100;
                        let winner_amount = total_pot - house_cut;

                        **game.to_account_info().try_borrow_mut_lamports()? -= house_cut;
                        **treasury_account.try_borrow_mut_lamports()? += house_cut;

                        let winner_acc = ctx.remaining_accounts
                            .iter()
                            .find(|a| a.key() == winner)
                            .ok_or(ErrorCode::PlayerNotInGame)?;

                        **game.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
                        **winner_acc.try_borrow_mut_lamports()? += winner_amount;

                        emit!(WinnerExtractedEvent {
                            game: game.key(),
                            winner,
                            amount: winner_amount,
                        });
                    }

                    emit!(GameSettledEvent {
                        game: game.key(),
                        total_pot: game.pot_amount,
                        winners_count: new_survivors.len() as u8,
                    });

                    game.state = GameState::Finished;
                    // Reset
                    game.player_count = 0;
                    game.pot_amount = 0;
                    game.current_round = 0;
                    game.block_start_time = 0;
                    for i in 0..MAX_PLAYERS {
                        game.players[i] = Pubkey::default();
                        game.survivors[i] = Pubkey::default();
                    }
                } else {
                    // Update survivors
                    game.state = GameState::InProgress { round, survivors: new_survivors.clone() };
                    for i in 0..MAX_PLAYERS {
                        game.survivors[i] = if i < new_survivors.len() { new_survivors[i] } else { Pubkey::default() };
                    }
                }
            },
            _ => return err!(ErrorCode::GameNotInProgress),
        }

        Ok(())
    }

    /// Withdraw accumulated fees from treasury (admin only)
    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        let treasury = &ctx.accounts.treasury;
        let recipient = &ctx.accounts.recipient;
        let authority = &ctx.accounts.authority;

        // Security: Only authorized admin can withdraw
        require!(
            authority.key() == Pubkey::from_str("FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt").unwrap(),
            ErrorCode::Unauthorized
        );

        // Check treasury has enough funds
        require!(
            treasury.lamports() >= amount,
            ErrorCode::InsufficientFunds
        );

        // Transfer funds
        **treasury.try_borrow_mut_lamports()? -= amount;
        **recipient.try_borrow_mut_lamports()? += amount;

        emit!(FeesWithdrawnEvent {
            amount,
            recipient: recipient.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = Game::MAX_SIZE,
        seeds = [b"room".as_ref(), &[room_id]],
        bump
    )]
    pub game: Box<Account<'info, Game>>,
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
    pub game: Box<Account<'info, Game>>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct RefundExpiredGame<'info> {
    #[account(
        mut,
        seeds = [b"room".as_ref(), &[room_id]],
        bump = game.bump
    )]
    pub game: Box<Account<'info, Game>>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct AdvanceRound<'info> {
    #[account(
        mut,
        seeds = [b"room".as_ref(), &[room_id]],
        bump = game.bump
    )]
    pub game: Box<Account<'info, Game>>,
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct SecureGain<'info> {
    #[account(
        mut,
        seeds = [b"room".as_ref(), &[room_id]],
        bump = game.bump
    )]
    pub game: Box<Account<'info, Game>>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(signer)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
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
    pub block_start_time: i64,
    pub current_round: u8,
    pub survivors: [Pubkey; MAX_PLAYERS],
    pub bump: u8,
}

impl Game {
    pub const MAX_SIZE: usize =
        8 +                    // account discriminator
        1 +                    // room_id
        8 +                    // entry_fee
        (32 * MAX_PLAYERS) +   // players
        1 +                    // player_count
        GAME_STATE_MAX_SIZE +  // state (largest variant)
        8 +                    // pot_amount
        8 +                    // resolve_slot
        8 +                    // last_activity_time
        8 +                    // block_start_time
        1 +                    // current_round
        (32 * MAX_PLAYERS) +   // survivors
        1;                     // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Waiting,
    InProgress { round: u8, survivors: Vec<Pubkey> },
    Finished,
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

#[event]
pub struct RoundAdvancedEvent {
    pub game: Pubkey,
    pub round: u8,
    pub survivors_count: u8,
    pub eliminated_count: u8,
}

#[event]
pub struct PlayerEliminatedEvent {
    pub game: Pubkey,
    pub player: Pubkey,
    pub round: u8,
}

#[event]
pub struct SurvivorEvent {
    pub game: Pubkey,
    pub player: Pubkey,
    pub round: u8,
}

#[event]
pub struct PlayerSecuredEvent {
    pub game: Pubkey,
    pub player: Pubkey,
    pub amount: u64,
    pub round: u8,
}

#[event]
pub struct FeesWithdrawnEvent {
    pub amount: u64,
    pub recipient: Pubkey,
    pub timestamp: i64,
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
    #[msg("Game is empty.")]
    GameEmpty,
    #[msg("Timer has not expired yet. Wait 20 seconds.")]
    TimerNotExpired,
    #[msg("Too many players for refund. Game must have less than 2 players.")]
    TooManyPlayers,
    #[msg("Not enough players. Need at least 2 players to start.")]
    NotEnoughPlayers,
    #[msg("Game is not in progress.")]
    GameNotInProgress,
    #[msg("Game already finished.")]
    GameAlreadyFinished,
    #[msg("Cannot secure gain before round 1.")]
    CannotSecureBeforeRound1,
    #[msg("Multiplier too low to secure.")]
    MultiplierTooLow,
    #[msg("Player is not a survivor.")]
    PlayerNotSurvivor,
    #[msg("Insufficient pot for secure.")]
    InsufficientPot,
    #[msg("Unauthorized. Only admin can perform this action.")]
    Unauthorized,
    #[msg("Insufficient funds in treasury.")]
    InsufficientFunds,
    #[msg("Room is full.")]
    RoomFull,
}