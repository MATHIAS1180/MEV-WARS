// FIX: Global singleton that deduplicates on-chain events by transaction signature.
// Every listener must emit through this bus instead of calling setState directly.

type EventType = 'win' | 'join' | 'refund' | 'round_advanced' | 'eliminated' | 'survived' | 'secured' | 'game_settled';

interface BusEvent {
  signature: string;
  eventType: EventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

type Listener = (event: BusEvent) => void;

class TransactionEventBus {
  // FIX: Set of already-processed signatures prevents duplicate processing
  private processedSignatures = new Set<string>();
  private listeners = new Map<EventType, Set<Listener>>();
  // FIX: Limit Set size to prevent unbounded memory growth
  private readonly maxSignatures = 2000;
  private signatureOrder: string[] = [];

  subscribe(eventType: EventType, callback: Listener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // FIX: Deduplication check before emitting — returns false if already processed
  emit(signature: string, eventType: EventType, payload: Record<string, unknown>): boolean {
    const dedupKey = `${signature}:${eventType}`;
    if (this.processedSignatures.has(dedupKey)) {
      return false; // Already processed
    }

    this.processedSignatures.add(dedupKey);
    this.signatureOrder.push(dedupKey);

    // FIX: Evict oldest entries to prevent unbounded growth
    while (this.signatureOrder.length > this.maxSignatures) {
      const oldest = this.signatureOrder.shift();
      if (oldest) this.processedSignatures.delete(oldest);
    }

    const event: BusEvent = { signature, eventType, payload, timestamp: Date.now() };
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(event);
        } catch (err) {
          console.error(`[TransactionEventBus] Listener error for ${eventType}:`, err);
        }
      }
    }
    return true;
  }

  // Check if a signature+type combo was already processed
  hasProcessed(signature: string, eventType: EventType): boolean {
    return this.processedSignatures.has(`${signature}:${eventType}`);
  }

  // Reset for testing or room changes
  clear(): void {
    this.processedSignatures.clear();
    this.signatureOrder = [];
  }
}

// FIX: Singleton instance — one bus for the entire app session
export const txEventBus = new TransactionEventBus();
export type { EventType, BusEvent, Listener };
