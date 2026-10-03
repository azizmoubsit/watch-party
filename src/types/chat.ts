import { z } from "zod";
import type { RoomRole } from "@/types/room";

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  role: RoomRole;
  content: string;
  created_at: string;
}

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
