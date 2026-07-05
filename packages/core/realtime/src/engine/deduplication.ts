/** Déduplication idempotente — fenêtre TTL configurable. */
export class DeduplicationStore {
  private readonly seen = new Map<string, number>();
  private dropped = 0;

  constructor(
    private readonly ttlMs = 30_000,
    private readonly maxEntries = 10_000,
  ) {}

  isDuplicate(key: string, now = Date.now()): boolean {
    this.prune(now);
    const existing = this.seen.get(key);
    if (existing != null && now - existing < this.ttlMs) {
      this.dropped += 1;
      return true;
    }
    this.seen.set(key, now);
    if (this.seen.size > this.maxEntries) this.prune(now, true);
    return false;
  }

  private prune(now: number, aggressive = false): void {
    for (const [key, at] of this.seen) {
      if (now - at >= this.ttlMs || aggressive) this.seen.delete(key);
      if (!aggressive && this.seen.size <= this.maxEntries * 0.8) break;
    }
  }

  getStats() {
    return { tracked: this.seen.size, dropped: this.dropped };
  }

  resetForTests(): void {
    this.seen.clear();
    this.dropped = 0;
  }
}
