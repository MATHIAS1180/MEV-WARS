// FIX: Animation queue that prevents duplicate or overlapping animations.
// Each animation is keyed by transaction signature to ensure exactly-once rendering.

export type AnimationStatus = 'pending' | 'playing' | 'done' | 'error';

export interface QueuedAnimation {
  id: string; // Unique key (tx signature + type)
  type: 'win' | 'lose' | 'survive' | 'eliminated' | 'refund';
  payload: Record<string, unknown>;
  status: AnimationStatus;
  enqueuedAt: number;
}

type AnimationChangeListener = (queue: QueuedAnimation[]) => void;

class AnimationQueueManager {
  private queue: QueuedAnimation[] = [];
  private listeners = new Set<AnimationChangeListener>();
  // FIX: Minimum delay between consecutive animations (ms)
  private readonly minDelayMs = 300;
  private lastPlayedAt = 0;

  subscribe(listener: AnimationChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    const snapshot = [...this.queue];
    for (const listener of this.listeners) {
      try { listener(snapshot); } catch (e) { console.error('[AnimationQueue] listener error:', e); }
    }
  }

  // FIX: Enqueue only if not already present (dedup by id)
  enqueue(id: string, type: QueuedAnimation['type'], payload: Record<string, unknown>): boolean {
    if (this.queue.some(a => a.id === id)) {
      return false; // Already queued
    }

    this.queue.push({
      id,
      type,
      payload,
      status: 'pending',
      enqueuedAt: Date.now(),
    });

    this.notify();
    this.processNext();
    return true;
  }

  // FIX: Get the currently playing animation (if any)
  getCurrent(): QueuedAnimation | null {
    return this.queue.find(a => a.status === 'playing') ?? null;
  }

  // FIX: Get the next pending animation (respecting min delay)
  private processNext(): void {
    const now = Date.now();
    if (now - this.lastPlayedAt < this.minDelayMs) {
      setTimeout(() => this.processNext(), this.minDelayMs - (now - this.lastPlayedAt));
      return;
    }

    const playing = this.queue.find(a => a.status === 'playing');
    if (playing) return; // Wait for current to finish

    const next = this.queue.find(a => a.status === 'pending');
    if (!next) return;

    next.status = 'playing';
    this.lastPlayedAt = Date.now();
    this.notify();
  }

  // FIX: Mark current animation as done and advance to next
  complete(id: string): void {
    const item = this.queue.find(a => a.id === id);
    if (item) {
      item.status = 'done';
    }
    // Remove done items older than 5s to prevent list bloat
    const cutoff = Date.now() - 5000;
    this.queue = this.queue.filter(a => a.status !== 'done' || a.enqueuedAt > cutoff);
    this.notify();
    this.processNext();
  }

  markError(id: string): void {
    const item = this.queue.find(a => a.id === id);
    if (item) {
      item.status = 'error';
    }
    this.notify();
    this.processNext();
  }

  clear(): void {
    this.queue = [];
    this.notify();
  }

  getQueue(): QueuedAnimation[] {
    return [...this.queue];
  }
}

// FIX: Singleton instance
export const animationQueue = new AnimationQueueManager();
