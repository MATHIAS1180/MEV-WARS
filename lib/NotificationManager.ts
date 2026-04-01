// FIX: Anti-spam notification manager with deduplication, max visible, and FIFO queue.
// Wraps sonner toast to enforce global notification hygiene.

import { toast } from 'sonner';

interface NotificationEntry {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

class NotificationManager {
  // FIX: Max simultaneous visible toasts
  private readonly maxVisible = 3;
  // FIX: Deduplication window in ms — same txid within this window is ignored
  private readonly deduplicationWindowMs = 5000;
  // FIX: Track recent notification IDs with their timestamps
  private recentNotifications = new Map<string, number>();
  private activeCount = 0;
  private queue: NotificationEntry[] = [];
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // FIX: Periodically clean up expired entries to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, ts] of this.recentNotifications) {
        if (now - ts > this.deduplicationWindowMs) {
          this.recentNotifications.delete(key);
        }
      }
    }, 10000);
  }

  // FIX: Show notification only if not duplicate and under max visible limit
  notify(id: string, type: NotificationEntry['type'], message: string, duration = 4000): boolean {
    const now = Date.now();

    // Deduplication check
    const lastShown = this.recentNotifications.get(id);
    if (lastShown && now - lastShown < this.deduplicationWindowMs) {
      return false; // Duplicate within window
    }

    this.recentNotifications.set(id, now);

    const entry: NotificationEntry = { id, type, message, timestamp: now };

    if (this.activeCount >= this.maxVisible) {
      // FIX: Queue notification if max visible reached (FIFO)
      this.queue.push(entry);
      // Prevent queue from growing unbounded
      if (this.queue.length > 10) this.queue.shift();
      return false;
    }

    this.showToast(entry, duration);
    return true;
  }

  private showToast(entry: NotificationEntry, duration = 4000): void {
    this.activeCount++;

    const toastFn = entry.type === 'success' ? toast.success
      : entry.type === 'error' ? toast.error
      : entry.type === 'warning' ? toast.warning
      : toast.info;

    toastFn(entry.message, {
      id: entry.id,
      duration,
      onDismiss: () => this.onToastDismissed(),
      onAutoClose: () => this.onToastDismissed(),
    });
  }

  private onToastDismissed(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);

    // FIX: Drain the queue if slots available
    if (this.queue.length > 0 && this.activeCount < this.maxVisible) {
      const next = this.queue.shift();
      if (next) {
        this.showToast(next);
      }
    }
  }

  // For promise-based toasts (join/secure), use a unique id
  notifyPromise<T>(
    id: string,
    promise: Promise<T>,
    messages: { loading: string; success: string; error: (e: any) => string }
  ): Promise<T> {
    const lastShown = this.recentNotifications.get(id);
    const now = Date.now();
    if (lastShown && now - lastShown < this.deduplicationWindowMs) {
      return promise;
    }
    this.recentNotifications.set(id, now);

    toast.promise(promise, {
      ...messages,
      id,
    });
    return promise;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.recentNotifications.clear();
    this.queue = [];
    this.activeCount = 0;
  }
}

// FIX: Singleton instance
export const notificationManager = new NotificationManager();
