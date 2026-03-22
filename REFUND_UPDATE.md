# Automatic Refund Feature - Implementation Complete

## What Changed

The smart contract now has a separate `refund_expired_game` instruction that automatically refunds players if:
- Timer has expired (30 seconds since first player joined)
- Less than 3 players in the room

## Files Updated

### 1. `solpg-program.rs` ✅
- Added `BLOCK_EXPIRATION_SECONDS` constant (30 seconds)
- Added new `refund_expired_game` instruction
- Added `RefundExpiredGame` accounts struct
- Updated `settle_winner` to require at least 3 players (no longer handles refunds)
- Added new error codes: `GameEmpty`, `TimerNotExpired`, `TooManyPlayers`, `NotEnoughPlayers`

### 2. `utils/anchor.ts` ✅
- Added `refundExpiredGame` instruction to IDL
- Added new error codes (6005-6008)

### 3. `scripts/crank.ts` ✅
- Added `refundExpiredGame()` function
- Updated main loop to check timer expiration
- If timer expired and <3 players → call `refund_expired_game`
- If timer expired OR multiple of 3 (and >=3 players) → call `settle_winner`

### 4. `app/api/crank/route.ts` ✅
- Added timer expiration check
- If timer expired and <3 players → call `refund_expired_game`
- Otherwise → call `settle_winner` (requires >=3 players)

## Next Steps

### 1. Deploy Updated Smart Contract to Solana Playground

✅ DONE! The smart contract has been deployed with the new Program ID: `6kBgAR5grqnabjUq6x5GMmjVWjHFoRJZgGcKGuy5zPJc`

All files have been updated with the new Program ID:
- ✅ `utils/anchor.ts`
- ✅ `scripts/crank.ts`
- ✅ `Anchor.toml`
- ✅ `programs/solana_russian_roulette/src/lib.rs`
- ✅ `solpg-program.rs`

### 2. Test the Refund Logic

**Scenario 1: Refund with 1-2 players**
1. Join a room with 1 or 2 players
2. Wait 30 seconds
3. The crank should automatically call `refund_expired_game`
4. All players should receive their entry fee back

**Scenario 2: Settle with 3+ players**
1. Join a room with 3+ players
2. Wait for timer to expire OR reach a multiple of 3
3. The crank should call `settle_winner`
4. Winners receive their prize (95% of pot divided by winners_count)

### 3. Redeploy Frontend to Vercel

After updating the Program ID, push to GitHub:
```bash
git add .
git commit -m "Add automatic refund feature"
git push
```

Vercel will automatically redeploy the site.

## How It Works

### Smart Contract Logic

**refund_expired_game:**
- Checks: game is waiting, player_count > 0, player_count < 3, timer expired (30s)
- Refunds all players their entry fee
- Resets the game state
- Emits `GameRefundedEvent`

**settle_winner:**
- Checks: game is waiting, player_count >= 3, current_slot > resolve_slot
- Calculates winners (1 per 3 players)
- Distributes 95% to winners, 5% to treasury
- Resets the game state
- Emits `GameSettledEvent` and `WinnerExtractedEvent`

### Crank Logic

The crank monitors all rooms every 3 seconds and:
1. Checks if timer expired (30s since `block_start_time`)
2. If expired and <3 players → refund
3. If expired OR multiple of 3 (and >=3 players) → settle
4. Uses 10s cooldown to avoid duplicate calls

## Error Codes

- 6000: GameNotInWaitingState
- 6001: PlayerAlreadyJoined
- 6002: PlayerNotInGame
- 6003: DrawTooEarly
- 6004: InvalidTreasury
- 6005: GameEmpty
- 6006: TimerNotExpired
- 6007: TooManyPlayers (for refund)
- 6008: NotEnoughPlayers (for settle)
