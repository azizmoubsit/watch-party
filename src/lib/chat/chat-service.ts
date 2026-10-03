import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/chat";
import type { RoomRole } from "@/types/room";

let lastSentTimestamp = 0;
const RATE_LIMIT_MS = 800; // Client-side rate limit: 1 msg per 800ms

export async function sendChatMessageAction(params: {
  roomId: string;
  displayName: string;
  role: RoomRole;
  content: string;
}): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const now = Date.now();
  if (now - lastSentTimestamp < RATE_LIMIT_MS) {
    return { success: false, error: "Please wait a moment before sending another message." };
  }
  lastSentTimestamp = now;

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, error: "Authentication required to send messages." };
  }

  const trimmedContent = params.content.trim();
  if (!trimmedContent) {
    return { success: false, error: "Message content cannot be empty." };
  }

  const { data: message, error } = await supabase
    .from("room_messages")
    .insert({
      room_id: params.roomId,
      user_id: session.user.id,
      display_name: params.displayName || "Anonymous User",
      role: params.role || "viewer",
      content: trimmedContent,
    })
    .select()
    .single();

  if (error || !message) {
    return { success: false, error: error?.message || "Failed to send message." };
  }

  return { success: true, message: message as ChatMessage };
}

export async function fetchRecentChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("room_messages")
    .select()
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as ChatMessage[];
}
