import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type { Notification } from "@sonafrik/types";

export class NotificationsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(params: {
    userId: string;
    limit: number;
    unreadOnly: boolean;
  }): Promise<Notification[]> {
    let query = this.supabase
      .from("notifications")
      .select("id, user_id, type, title, body, data, read_at, created_at")
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false })
      .limit(params.limit);

    if (params.unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Notification[];
  }

  async markRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (error) throw error;
  }

  async markAllRead(_userId: string): Promise<void> {
    const { error } = await this.supabase.rpc("mark_all_notifications_read");
    if (error) throw error;
  }

  async countUnread(_userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc("count_unread_notifications");
    if (error) throw error;
    return (data as number) ?? 0;
  }
}
