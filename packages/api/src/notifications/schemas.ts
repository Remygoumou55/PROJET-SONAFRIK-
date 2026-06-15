import { z } from "zod";

export const listNotificationsSchema = z.object({
  userId:     z.string().uuid(),
  limit:      z.number().int().min(1).max(50).default(30),
  unreadOnly: z.boolean().default(false),
});

export const markReadSchema = z.object({
  notificationId: z.string().uuid(),
});
