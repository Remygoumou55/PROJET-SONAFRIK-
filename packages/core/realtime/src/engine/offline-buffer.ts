import type { SrtspEvent } from "../types";

/** Buffer offline — flush à la reconnexion. */
export class OfflineBuffer {
  private readonly buffer: SrtspEvent[] = [];
  private flushed = 0;
  private online = true;

  setOnline(online: boolean): void {
    const wasOffline = !this.online;
    this.online = online;
    if (online && wasOffline && this.buffer.length > 0) {
      /* flush déclenché par le moteur via drain() */
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  bufferEvent(event: SrtspEvent): void {
    if (this.online) return;
    this.buffer.push(event);
  }

  drain(): SrtspEvent[] {
    const events = [...this.buffer];
    this.buffer.length = 0;
    this.flushed += events.length;
    return events;
  }

  getStats() {
    return { buffered: this.buffer.length, flushed: this.flushed };
  }

  resetForTests(): void {
    this.buffer.length = 0;
    this.flushed = 0;
    this.online = true;
  }
}
