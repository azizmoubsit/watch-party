"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/chat";
import type { RoomRole } from "@/types/room";
import { fetchRecentChatMessages, sendChatMessageAction } from "./chat-service";

export interface UseRoomChatOptions {
  roomId: string;
  userId?: string;
  displayName: string;
  role: RoomRole;
}

export function useRoomChat({
  roomId,
  displayName,
  role,
}: UseRoomChatOptions) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load initial chat history
  React.useEffect(() => {
    let mounted = true;

    async function initChat() {
      if (!roomId) return;
      setIsLoading(true);
      const history = await fetchRecentChatMessages(roomId);
      if (mounted) {
        setMessages(history);
        setIsLoading(false);
      }
    }

    initChat();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  // Subscribe to Realtime Postgres Changes on room_messages
  React.useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channelName = `room_chat:${roomId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async (content: string) => {
    setError(null);
    const res = await sendChatMessageAction({
      roomId,
      displayName,
      role,
      content,
    });

    if (!res.success) {
      setError(res.error || "Failed to send message.");
      return false;
    }

    if (res.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message!.id)) return prev;
        return [...prev, res.message!];
      });
    }

    return true;
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
