import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PROGRAM_ID } from '../config/constants';
import { IDL } from '../utils/anchor';
import { Program, AnchorProvider, EventParser, BorshCoder } from '@coral-xyz/anchor';
// FIX: Import txEventBus for cross-component dedup (shared with useGame.ts)
import { txEventBus } from '../lib/TransactionEventBus';

export interface Activity {
  id: string;
  type: 'win' | 'join' | 'refund';
  address: string;
  amount?: number;
  roomId: number;
  timestamp: number;
}

const ROOMS = [101, 102, 103]; // 0.01, 0.1, 1.0 SOL rooms
const MAX_ACTIVITIES = 20; // Keep last 20 activities

export function useLiveActivity() {
  const { connection } = useConnection();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const activitiesRef = useRef<Activity[]>([]);
  const processedSignatures = useRef<Set<string>>(new Set());
  const previousPlayerCountsRef = useRef<Record<number, number>>({});

  const addActivity = useCallback((activity: Activity) => {
    setActivities((prev) => {
      // Check for duplicates
      const exists = prev.some(a => a.id === activity.id);
      if (exists) return prev;
      
      const newActivities = [activity, ...prev].slice(0, MAX_ACTIVITIES);
      activitiesRef.current = newActivities;
      return newActivities;
    });
  }, []);

  const formatAddress = useCallback((address: string): string => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  }, []);

  // Load recent historical activities on mount
  const loadRecentHistory = useCallback(async () => {
    const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
    const program = new Program(IDL, PROGRAM_ID, provider);
    const historicalActivities: Activity[] = [];

    try {
      // Fetch recent transactions for each room
      for (const roomId of ROOMS) {
        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('room'), Buffer.from([roomId])],
          PROGRAM_ID
        );

        try {
          const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 30 });

          for (const sig of signatures) {
            if (processedSignatures.current.has(sig.signature)) continue;
            processedSignatures.current.add(sig.signature);

            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            });

            if (tx?.meta?.logMessages && tx.blockTime) {
              const parser = new EventParser(PROGRAM_ID, new BorshCoder(IDL as any));
              const timestamp = tx.blockTime * 1000;

              for (const event of parser.parseLogs(tx.meta.logMessages)) {
                if (event.name === 'WinnerExtractedEvent') {
                  const data = event.data as any;
                  const winner = data.winner.toString();
                  const amount = data.amount.toNumber() / 1e9;

                  historicalActivities.push({
                    id: `win-${roomId}-${winner}-${timestamp}`,
                    type: 'win',
                    address: formatAddress(winner),
                    amount: parseFloat(amount.toFixed(4)),
                    roomId,
                    timestamp,
                  });
                }

                if (event.name === 'PlayerJoinedEvent') {
                  const data = event.data as any;
                  const player = data.player.toString();

                  historicalActivities.push({
                    id: `join-${roomId}-${player}-${timestamp}`,
                    type: 'join',
                    address: formatAddress(player),
                    roomId,
                    timestamp,
                  });
                }

                if (event.name === 'GameRefundedEvent') {
                  historicalActivities.push({
                    id: `refund-${roomId}-${timestamp}`,
                    type: 'refund',
                    address: 'All players',
                    roomId,
                    timestamp,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error loading history for room ${roomId}:`, err);
        }
      }

      // Sort by timestamp (newest first) and limit
      const sorted = historicalActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 15);

      setActivities(sorted);
      activitiesRef.current = sorted;
    } catch (err) {
      console.error('Error loading recent history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [connection, formatAddress]);

  useEffect(() => {
    // Load recent history first
    loadRecentHistory();

    // FIX: Separate arrays for interval IDs and subscription IDs to clean up correctly
    const intervalIds: ReturnType<typeof setInterval>[] = [];
    const accountSubIds: number[] = [];
    const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
    const program = new Program(IDL, PROGRAM_ID, provider);

    // Subscribe to all rooms
    ROOMS.forEach((roomId) => {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('room'), Buffer.from([roomId])],
        PROGRAM_ID
      );

      // FIX: Use ONLY onAccountChange for real-time updates (removed duplicate polling)
      // The setInterval polling was causing double events with onAccountChange.
      // onAccountChange is sufficient for real-time detection.

      // Listen for account changes
      const subId = connection.onAccountChange(
        gamePda,
        async (accountInfo) => {
          try {
            const decoded = program.coder.accounts.decode('Game', accountInfo.data);
            const currentPlayerCount = decoded.playerCount || 0;
            const prevPlayerCount = previousPlayerCountsRef.current[roomId] ?? 0;

            // Player joined
            if (currentPlayerCount > prevPlayerCount && currentPlayerCount > 0) {
              const players = decoded.players as any[];
              const lastPlayer = players[currentPlayerCount - 1];
              
              if (lastPlayer && lastPlayer.toString() !== PublicKey.default.toString()) {
                // FIX: Use deterministic ID based on player + playerCount (not Date.now/Math.random)
                const activityId = `join-${roomId}-${lastPlayer.toString()}-${currentPlayerCount}`;
                
                addActivity({
                  id: activityId,
                  type: 'join',
                  address: formatAddress(lastPlayer.toString()),
                  roomId,
                  timestamp: Date.now(),
                });
              }
            }

            // Game resolved (players went to 0 from 2+)
            if (prevPlayerCount >= 2 && currentPlayerCount === 0) {
              // Fetch recent transactions to get winner info
              try {
                const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 5 });
                
                for (const sig of signatures) {
                  if (processedSignatures.current.has(sig.signature)) continue;
                  processedSignatures.current.add(sig.signature);

                  const tx = await connection.getTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0,
                    commitment: 'confirmed',
                  });
                  
                  // Cache bust: skip if already 2 min old (avoid stale data)
                  if (tx?.blockTime && Date.now() / 1000 - tx.blockTime > 120) continue;

                  if (tx?.meta?.logMessages) {
                    const parser = new EventParser(PROGRAM_ID, new BorshCoder(IDL as any));
                    
                    for (const event of parser.parseLogs(tx.meta.logMessages)) {
                      if (event.name === 'WinnerExtractedEvent') {
                        const data = event.data as any;
                        const winner = data.winner.toString();
                        const amount = data.amount.toNumber() / 1e9;

                        // FIX: Gate through txEventBus for cross-component dedup
                        // If useGame.ts already processed this tx, skip the activity
                        if (!txEventBus.hasProcessed(sig.signature, 'win')) {
                          txEventBus.emit(sig.signature, 'win', { winner, amount, roomId });
                        }
                        addActivity({
                          id: `win-${roomId}-${winner}-${sig.signature.slice(0, 16)}`,
                          type: 'win',
                          address: formatAddress(winner),
                          amount: parseFloat(amount.toFixed(4)),
                          roomId,
                          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
                        });
                      }

                      if (event.name === 'GameRefundedEvent') {
                        // FIX: Gate through txEventBus for cross-component dedup
                        if (!txEventBus.hasProcessed(sig.signature, 'refund')) {
                          txEventBus.emit(sig.signature, 'refund', { roomId });
                        }
                        addActivity({
                          id: `refund-${roomId}-${sig.signature.slice(0, 16)}`,
                          type: 'refund',
                          address: 'All players',
                          roomId,
                          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
                        });
                      }
                    }
                    break; // Found the transaction with events
                  }
                }
              } catch (err) {
                console.error('Error fetching winner info:', err);
              }
            }

            // Store player count for next comparison
            previousPlayerCountsRef.current[roomId] = currentPlayerCount;
          } catch (err) {
            console.error('Error decoding game state:', err);
          }
        },
        'confirmed'
      );

      accountSubIds.push(subId);
    });

    // FIX: Cleanup — properly clear both intervals and account subscriptions
    return () => {
      intervalIds.forEach((id) => clearInterval(id));
      accountSubIds.forEach((subId) => {
        connection.removeAccountChangeListener(subId).catch(console.error);
      });
    };
  }, [connection, addActivity, formatAddress, loadRecentHistory]);

  return { activities, isLoadingHistory };
}
