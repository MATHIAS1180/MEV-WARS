# Live Activity - Historical Events & Explorer Integration

## New Features

### 1. Load Recent History on Mount

When the page loads, the Live Activity feed now automatically fetches the last 10-15 events from the blockchain:

```typescript
const loadRecentHistory = async () => {
  // For each room (101, 102, 103)
  // Fetch last 10 signatures
  // Parse transaction logs for events
  // Extract WinnerExtractedEvent, PlayerJoinedEvent, GameRefundedEvent
  // Sort by timestamp (newest first)
  // Display up to 15 most recent activities
}
```

**Benefits:**
- Users see activity immediately (not just empty state)
- Shows what happened recently even if they just arrived
- Provides context about game activity

**Performance:**
- Only loads once on mount
- Fetches max 10 transactions per room (30 total)
- Caches processed signatures to avoid duplicates

### 2. "View All on Solana Explorer" Button

Added a button in the header that links directly to the program on Solana Explorer:

```tsx
<a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}>
  <ExternalLink /> View All
</a>
```

**Features:**
- Opens in new tab
- Links to program address on Solana Explorer
- Shows "View All" text on desktop, icon only on mobile
- Hover effects with Solana green accent

**Why?**
- Users can see complete transaction history
- Provides transparency (blockchain verification)
- Allows deep dive into specific transactions
- Shows all rooms and all time (not just recent 15)

### 3. Loading State

Shows a spinner while fetching historical events:

```tsx
{isLoadingHistory ? (
  <div>
    <RefreshCw className="animate-spin" />
    Loading recent activity...
  </div>
) : ...}
```

### 4. Duplicate Prevention

Prevents showing the same event twice:

```typescript
const processedSignatures = useRef<Set<string>>(new Set());

// When processing transaction
if (processedSignatures.current.has(sig.signature)) continue;
processedSignatures.current.add(sig.signature);
```

**Why?**
- Historical load might overlap with real-time events
- Ensures clean feed without duplicates
- Uses signature hash as unique identifier

## User Flow

### First Visit
1. Page loads
2. Shows "Loading recent activity..." (2-3 seconds)
3. Displays last 15 events from all rooms
4. Starts listening for new real-time events

### Ongoing Usage
1. New events appear at top instantly
2. Old events scroll down
3. Max 20 events kept in memory
4. Click "View All" to see complete history on Explorer

## Technical Details

### Event Types Loaded from History

**WinnerExtractedEvent:**
```typescript
{
  type: 'win',
  address: '8xA...kP9',
  amount: 0.285,
  roomId: 102,
  timestamp: 1234567890000
}
```

**PlayerJoinedEvent:**
```typescript
{
  type: 'join',
  address: '3mB...xL2',
  roomId: 101,
  timestamp: 1234567890000
}
```

**GameRefundedEvent:**
```typescript
{
  type: 'refund',
  address: 'All players',
  roomId: 103,
  timestamp: 1234567890000
}
```

### Timestamp Handling

Historical events use `blockTime` from transaction:
```typescript
const timestamp = tx.blockTime * 1000; // Convert to milliseconds
```

Real-time events use current time:
```typescript
const timestamp = Date.now();
```

### Sorting

All activities (historical + real-time) are sorted by timestamp:
```typescript
activities.sort((a, b) => b.timestamp - a.timestamp)
```

Newest events always appear at the top.

### Explorer Link

Links to Solana Explorer with program address:
- **Devnet**: `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`
- **Mainnet**: `https://explorer.solana.com/address/${PROGRAM_ID}`

Users can:
- See all transactions
- Verify winners on-chain
- Check transaction details
- View complete history

## Configuration

### Limits

```typescript
const MAX_ACTIVITIES = 20;  // Max in memory
const HISTORY_LIMIT = 15;   // Max loaded on mount
const SIGS_PER_ROOM = 10;   // Max transactions fetched per room
```

### Rooms Monitored

```typescript
const ROOMS = [101, 102, 103];
```

All 3 rooms are monitored for both historical and real-time events.

## Error Handling

### Network Errors
- Catches errors per room (one room failure doesn't break others)
- Logs errors to console
- Continues with partial data if some rooms fail

### Missing Events
- Some old transactions might not have events (before events were added)
- Gracefully skips transactions without parseable events
- No crashes or errors shown to user

### RPC Limits
- Fetches only 10 transactions per room (reasonable limit)
- Uses 'confirmed' commitment (faster than 'finalized')
- Doesn't overwhelm RPC endpoint

## UI/UX Improvements

### Loading State
- Shows spinner during initial load
- Clear message: "Loading recent activity..."
- Smooth transition to content

### Empty State
- Only shows if no historical events AND no real-time events
- Provides context: "Waiting for activity..."
- Explains: "Events will appear here in real-time"

### Explorer Button
- Prominent placement in header
- Icon + text on desktop
- Icon only on mobile (responsive)
- Hover effects with Solana green
- Opens in new tab (doesn't navigate away)

### Activity Cards
- Historical events look identical to real-time events
- Smooth animations for all entries
- Timestamps update every second
- Hover effects on all cards

## Testing

### Test Historical Load
1. Refresh page
2. Should see "Loading recent activity..." briefly
3. Should see last 15 events appear
4. Should be sorted by time (newest first)

### Test Real-Time + History
1. Wait for historical load to complete
2. Join a round
3. New event should appear at top
4. Historical events should remain below

### Test Explorer Link
1. Click "View All" button
2. Should open Solana Explorer in new tab
3. Should show program address
4. Should display all transactions

### Test Duplicates
1. Load page (gets historical events)
2. Trigger new event that was in history
3. Should NOT see duplicate
4. Should only show once

## Future Enhancements

Potential improvements:
- [ ] Pagination for historical events (load more button)
- [ ] Filter by room in UI
- [ ] Filter by event type (wins only, joins only)
- [ ] Click activity to see transaction details
- [ ] Export activity log as CSV
- [ ] Activity statistics dashboard
- [ ] Notification when specific player wins
- [ ] Highlight your own activities

## Summary

Live Activity now provides:
- ✅ Recent history on page load (last 15 events)
- ✅ Real-time updates for new events
- ✅ "View All" button to Solana Explorer
- ✅ Loading state during fetch
- ✅ Duplicate prevention
- ✅ Smooth UX with no empty states
- ✅ Complete transparency (blockchain verification)

Users get immediate context when they arrive and can verify everything on-chain! 🎉
