// FIX: Resilient EventSource wrapper with exponential backoff reconnection
// and UI status callback for connection state indicator.

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface ResilientEventSourceOptions {
  url: string;
  onSnapshot: (data: unknown) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  // FIX: Reconnection strategy with exponential backoff
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  backoffMultiplier?: number;
}

export class ResilientEventSource {
  private es: EventSource | null = null;
  private closed = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentBackoffMs: number;
  private readonly options: Required<ResilientEventSourceOptions>;
  private status: ConnectionStatus = 'connecting';

  constructor(opts: ResilientEventSourceOptions) {
    this.options = {
      initialBackoffMs: opts.initialBackoffMs ?? 500,
      maxBackoffMs: opts.maxBackoffMs ?? 30000,
      backoffMultiplier: opts.backoffMultiplier ?? 2,
      url: opts.url,
      onSnapshot: opts.onSnapshot,
      onStatusChange: opts.onStatusChange ?? (() => {}),
    };
    this.currentBackoffMs = this.options.initialBackoffMs;
    this.connect();
  }

  private setStatus(s: ConnectionStatus): void {
    if (this.status === s) return;
    this.status = s;
    this.options.onStatusChange(s);
  }

  private connect(): void {
    if (this.closed) return;

    this.setStatus(this.es === null ? 'connecting' : 'reconnecting');

    this.es = new EventSource(this.options.url);

    this.es.addEventListener('snapshot', (event) => {
      // FIX: Reset backoff on successful message
      this.currentBackoffMs = this.options.initialBackoffMs;
      this.setStatus('connected');

      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.options.onSnapshot(data);
      } catch (e) {
        console.error('[ResilientEventSource] Snapshot parse error:', e);
      }
    });

    this.es.addEventListener('ready', () => {
      this.setStatus('connected');
      this.currentBackoffMs = this.options.initialBackoffMs;
    });

    this.es.addEventListener('error', () => {
      this.handleDisconnect();
    });
  }

  private handleDisconnect(): void {
    if (this.es) {
      this.es.close();
      this.es = null;
    }

    if (this.closed) {
      this.setStatus('disconnected');
      return;
    }

    // FIX: Exponential backoff reconnection (500ms, 1s, 2s, 4s, ..., max 30s)
    this.setStatus('reconnecting');
    console.warn(`[ResilientEventSource] Reconnecting in ${this.currentBackoffMs}ms...`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.currentBackoffMs = Math.min(
        this.currentBackoffMs * this.options.backoffMultiplier,
        this.options.maxBackoffMs
      );
      this.connect();
    }, this.currentBackoffMs);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.es) {
      this.es.close();
      this.es = null;
    }
    this.setStatus('disconnected');
  }
}
