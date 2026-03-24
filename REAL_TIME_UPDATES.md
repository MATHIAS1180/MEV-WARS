# Real-Time Updates & Notifications System

## Overview
The MEV Wars Casino implements a comprehensive real-time update system that ensures users are always informed of game state changes without needing to refresh the page.

## Automatic Updates (No Refresh Required)

### 1. Blockchain State Monitoring
**Location**: `hooks/useGame.ts`

The `useGame` hook uses Solana's `onAccountChange` listener to monitor the game account in real-time:

```typescript
const subId = connection.onAccountChange(gamePda, async (info) => {
  const decoded = program.coder.accounts.decode('Game', info.data);
  setGameState(decoded); // Automatic UI update
}, 'confirmed');
```

**What gets updated automatically:**
- Player count changes
- Pot amount changes
- Game state transitions (waiting → active → settled)
- Timer updates
- Player positions

### 2. Notification System
**Location**: `app/page.tsx`

Uses `sonner` toast library for non-intrusive notifications.

#### Player Join Notifications

**When you join:**
```typescript
toast.info(`Entered round — Position #${myPlayerIndex + 1}`);
```

**When others join (while you're in game):**
```typescript
toast.info(`Player joined! ${current} players in round`, { duration: 2000 });
```

#### Round Start Notification

**When 3+ players reached (timer starts):**
```typescript
toast.success('Round starting! Timer activated', { duration: 3000 });
```

#### Timer Warnings

**10 seconds left (< 3 players):**
```typescript
toast.warning('10 seconds left! Need 3 players minimum', { duration: 3000 });
```

**5 seconds left (≥ 3 players):**
```typescript
toast.info('5 seconds until round ends!', { duration: 2000 });
```

#### Refund Notification

**When round expires without enough players:**
```typescript
toast.success('Round expired: Not enough players. Your funds have been refunded.', { duration: 5000 });
```

**Automatic cleanup on refund:**
- Stops spinning animation
- Clears countdown
- Resets transaction state
- Clears result overlay
- Resets player position
- Fetches fresh state

#### Win/Lose Results

**Win notification:**
```typescript
setShowResult({ 
  type: 'win', 
  msg: `You won! +${winAmt} SOL sent to your wallet.`, 
  amount: parseFloat(winAmt) 
});
```

**Lose notification:**
```typescript
setShowResult({ 
  type: 'lose', 
  msg: "Better luck next round!" 
});
```

**Result overlay features:**
- Full-screen modal with spring animation
- Trophy icon for wins, Skull for losses
- Prize amount display with gradient
- Auto-closes after 10 seconds
- Manual close with button click

### 3. Visual Updates

#### MiningBlock Component
**30 squares in 5x6 grid** - Each square represents 1 player slot

**Real-time visual changes:**
- Squares light up as players join (color-coded)
- Glow effects on active squares
- Pulsing animations during countdown
- Spinning animation when round resolves
- Player number badges (#1, #2, etc.)

**Colors**: Uses Solana official color palette
- Each of 30 squares has unique color
- Active squares: Full color with glow
- Inactive squares: Dimmed with low opacity

#### GameCard Component
**Real-time stat updates:**
- Player count (updates instantly)
- Pool amount (updates with each join)
- Winner count (calculated: floor(players / 3))
- Win probability (recalculated: winners / players * 100)
- Timer countdown (updates every second)

**Visual states:**
- "Connect Wallet" - Not connected
- "ENTER ROUND" button - Connected, not in game
- "You're In! Position #X" - In game
- Countdown timer - Shows when game active

### 4. State Synchronization

#### Player Position Tracking
```typescript
const myPlayerIndex = useMemo(() => {
  if (!gameState?.players || !publicKey) return null;
  const idx = gameState.players.findIndex(
    p => p.toString() === publicKey.toString()
  );
  return idx >= 0 ? idx : null;
}, [gameState?.players, publicKey]);
```

**Persists across updates:**
- Position maintained during countdown
- Cleared only after result shown
- Survives state refetches

#### Refund Detection
```typescript
// Tracks if player was in game before refund
const wasInGameRef = useRef<boolean>(false);

// Detects refund scenario
if (prev > 0 && prev < 3 && current === 0 && wasInGameRef.current) {
  // Show refund notification
  // Clean up all state
  // Fetch fresh state
}
```

### 5. Crank System (Automatic Round Resolution)

**Location**: `app/api/crank/route.ts`

**Triggered automatically when:**
- Timer reaches 0
- Called from frontend: `triggerCrank()`

**Retry logic:**
- Max 5 retries with 1s delay
- Prevents duplicate calls (10s cooldown)
- Error handling for missing config

**What it does:**
- Checks if round should resolve
- Selects winners on-chain
- Distributes prizes
- Resets game state
- Triggers refunds if needed

## Event Flow Examples

### Scenario 1: Successful Round (3+ Players)

1. **Player 1 joins**
   - ✅ Account change detected
   - ✅ UI updates: 1 player, 1 square lit
   - ✅ Notification: "Entered round — Position #1"

2. **Player 2 joins**
   - ✅ Account change detected
   - ✅ UI updates: 2 players, 2 squares lit
   - ✅ Notification: "Player joined! 2 players in round"

3. **Player 3 joins**
   - ✅ Account change detected
   - ✅ UI updates: 3 players, 3 squares lit
   - ✅ Timer starts (30 seconds)
   - ✅ Notification: "Round starting! Timer activated"

4. **Timer countdown**
   - ✅ Updates every second
   - ✅ Countdown timer shows in GameCard
   - ✅ At 5s: "5 seconds until round ends!"

5. **Timer reaches 0**
   - ✅ Crank triggered automatically
   - ✅ Winners selected on-chain
   - ✅ 5-second countdown overlay
   - ✅ Spinning animation
   - ✅ Result overlay shows win/lose
   - ✅ Auto-closes after 10s
   - ✅ Fresh state fetched

### Scenario 2: Refund (< 3 Players)

1. **Player 1 joins**
   - ✅ Notification: "Entered round — Position #1"

2. **Player 2 joins**
   - ✅ Notification: "Player joined! 2 players in round"

3. **Timer countdown**
   - ✅ At 10s: "10 seconds left! Need 3 players minimum"

4. **Timer reaches 0**
   - ✅ Crank triggered
   - ✅ Refund executed on-chain
   - ✅ Account change detected (players → 0)
   - ✅ Notification: "Round expired: Not enough players. Your funds have been refunded."
   - ✅ All state cleaned up
   - ✅ Fresh state fetched

## Testing Real-Time Updates

### Manual Tests

1. **Join Test**
   - Connect wallet
   - Click "ENTER ROUND"
   - ✅ Should see position notification
   - ✅ Square should light up
   - ✅ Stats should update

2. **Multi-Player Test**
   - Have friend join same room
   - ✅ Should see "Player joined!" notification
   - ✅ Player count should increment
   - ✅ Additional square should light up

3. **Timer Test**
   - Wait for 3 players
   - ✅ Should see "Round starting!" notification
   - ✅ Timer should appear in GameCard
   - ✅ Countdown should update every second

4. **Refund Test**
   - Join with < 3 players
   - Wait for timer to expire
   - ✅ Should see refund notification
   - ✅ UI should reset
   - ✅ No result overlay

5. **Win/Lose Test**
   - Complete round with 3+ players
   - ✅ Should see 5-second countdown
   - ✅ Should see spinning animation
   - ✅ Should see result overlay
   - ✅ Should auto-close after 10s

### Browser Console Logs

Enable detailed logging in `hooks/useGame.ts`:
```
[useGame] Game settled detected! prev: 3 current: 0
[useGame] Creating mock result: { players: 3, numWinners: 1, ... }
[useGame] Fetching signatures, retry: 0
[useGame] Found 5 signatures
[useGame] Parsing logs for sig: abc12345
[useGame] Found real result! { winner: "...", ... }
```

## Performance Considerations

### Optimizations
- `useMemo` for expensive calculations (player index, room data)
- `useCallback` for stable function references
- `useRef` for values that don't trigger re-renders
- Debounced crank calls (10s cooldown)
- Efficient state updates (only changed values)

### Network Efficiency
- Single WebSocket connection per game account
- Automatic reconnection on disconnect
- Confirmed commitment level (balance speed/reliability)
- Batched transaction submissions

## Troubleshooting

### Updates Not Working?

1. **Check WebSocket connection**
   - Browser console should show no errors
   - Network tab should show active WS connection

2. **Check wallet connection**
   - Wallet must be connected for player-specific updates
   - Reconnect wallet if issues persist

3. **Check RPC endpoint**
   - Ensure RPC supports WebSocket subscriptions
   - Some free RPCs have limited WS support

4. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Restart browser

### Notifications Not Showing?

1. **Check toast position**
   - Should be `top-center`
   - Verify `<Toaster />` component rendered

2. **Check browser permissions**
   - Some browsers block notifications
   - Check site settings

3. **Check console for errors**
   - Look for toast-related errors
   - Verify sonner library loaded

## Future Enhancements

Potential improvements:
- [ ] Sound effects for notifications
- [ ] Vibration on mobile devices
- [ ] Browser notifications (with permission)
- [ ] Activity feed with recent events
- [ ] Live player list with avatars
- [ ] Chat system for players
- [ ] Leaderboard with real-time updates
- [ ] Transaction history with live updates

## Summary

The MEV Wars Casino provides a fully real-time experience:
- ✅ No refresh required for any updates
- ✅ Instant notifications for all events
- ✅ Visual feedback for state changes
- ✅ Automatic refund handling
- ✅ Smooth animations and transitions
- ✅ Reliable WebSocket monitoring
- ✅ Comprehensive error handling

All updates happen automatically through Solana's account change listeners and React's state management system.
