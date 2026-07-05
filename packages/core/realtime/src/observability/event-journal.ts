import type { SrtspJournalEntry } from "../types";

const MAX_ENTRIES = 200;

/** Journal interne — toutes les erreurs SRTSP tracées sans console.log prod. */
export class EventJournal {
  private readonly entries: SrtspJournalEntry[] = [];

  log(level: SrtspJournalEntry["level"], code: string, message: string, context?: Record<string, unknown>): void {
    this.entries.push({ at: Date.now(), level, code, message, context });
    if (this.entries.length > MAX_ENTRIES) this.entries.shift();
  }

  error(code: string, message: string, context?: Record<string, unknown>): void {
    this.log("error", code, message, context);
  }

  warn(code: string, message: string, context?: Record<string, unknown>): void {
    this.log("warn", code, message, context);
  }

  getRecent(limit = 20): SrtspJournalEntry[] {
    return this.entries.slice(-limit);
  }

  get count(): number {
    return this.entries.length;
  }

  resetForTests(): void {
    this.entries.length = 0;
  }
}
