import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type { Notification } from "@sonafrik/types";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationError } from "./errors";
import { listNotificationsSchema, markReadSchema } from "./schemas";

export class NotificationsService {
  private readonly repo: NotificationsRepository;

  constructor(client: SupabaseClient<Database>) {
    this.repo = new NotificationsRepository(client);
  }

  async listNotifications(params: {
    userId: string;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    const validated = listNotificationsSchema.parse({
      userId:     params.userId,
      limit:      params.limit ?? 30,
      unreadOnly: params.unreadOnly ?? false,
    });
    try {
      return await this.repo.list(validated);
    } catch {
      throw new NotificationError("list_failed");
    }
  }

  async markRead(params: { notificationId: string }): Promise<void> {
    const validated = markReadSchema.parse(params);
    try {
      await this.repo.markRead(validated.notificationId);
    } catch {
      throw new NotificationError("mark_failed");
    }
  }

  async markAllRead(userId: string): Promise<void> {
    try {
      await this.repo.markAllRead(userId);
    } catch {
      throw new NotificationError("mark_failed");
    }
  }

  async countUnread(userId: string): Promise<number> {
    try {
      return await this.repo.countUnread(userId);
    } catch {
      return 0;
    }
  }
}

export function createNotificationsService(
  client: SupabaseClient<Database>,
): NotificationsService {
  return new NotificationsService(client);
}
