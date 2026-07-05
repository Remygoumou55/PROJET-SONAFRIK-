import type { SrtspEvent } from "../types";

export interface QueuedEvent {
  event: SrtspEvent;
  attempts: number;
  enqueuedAt: number;
}

export type QueueProcessor = (event: SrtspEvent) => Promise<void> | void;

export interface EventQueueOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  onRetry?: () => void;
  onFailure?: (event: SrtspEvent, error: unknown) => void;
}

/** Queue ordonnée — retry exponentiel + timeout. */
export class EventQueue {
  private readonly pending: QueuedEvent[] = [];
  private processing = false;
  private failed = 0;
  private retries = 0;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly timeoutMs: number;
  private readonly onRetry?: () => void;
  private readonly onFailure?: (event: SrtspEvent, error: unknown) => void;

  constructor(options: EventQueueOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 50;
    this.timeoutMs = options.timeoutMs ?? 5_000;
    this.onRetry = options.onRetry;
    this.onFailure = options.onFailure;
  }

  enqueue(event: SrtspEvent): void {
    this.pending.push({ event, attempts: 0, enqueuedAt: Date.now() });
  }

  async flush(processor: QueueProcessor): Promise<void> {
    while (this.pending.length > 0) {
      await this.processOne(processor);
    }
  }

  private async processOne(processor: QueueProcessor): Promise<void> {
    if (this.processing || this.pending.length === 0) return;
    this.processing = true;
    const item = this.pending.shift();
    if (!item) {
      this.processing = false;
      return;
    }

    try {
      await Promise.race([
        Promise.resolve(processor(item.event)),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("SRTSP queue processor timeout")), this.timeoutMs);
        }),
      ]);
    } catch (err) {
      item.attempts += 1;
      if (item.attempts <= this.maxRetries) {
        this.retries += 1;
        this.onRetry?.();
        const delay = this.baseDelayMs * 2 ** (item.attempts - 1);
        await new Promise((r) => setTimeout(r, delay));
        this.pending.unshift(item);
      } else {
        this.failed += 1;
        this.onFailure?.(item.event, err);
      }
    } finally {
      this.processing = false;
    }
  }

  getStats() {
    return {
      pending: this.pending.length,
      processing: this.processing ? 1 : 0,
      failed: this.failed,
      retries: this.retries,
    };
  }

  resetForTests(): void {
    this.pending.length = 0;
    this.processing = false;
    this.failed = 0;
    this.retries = 0;
  }
}
