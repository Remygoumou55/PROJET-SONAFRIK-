/** Simple async mutex for concurrent reservation safety */
export class AsyncMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(timeoutMs = 5000): Promise<() => void> {
    const start = Date.now();

    while (this.locked) {
      const remaining = timeoutMs - (Date.now() - start);
      if (remaining <= 0) {
        throw new Error("isrc_lock_timeout");
      }

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("isrc_lock_timeout"));
        }, remaining);

        this.waitQueue.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    this.locked = true;

    return () => {
      this.locked = false;
      const next = this.waitQueue.shift();
      if (next) next();
    };
  }

  async run<T>(fn: () => Promise<T>, timeoutMs = 5000): Promise<T> {
    const release = await this.acquire(timeoutMs);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
