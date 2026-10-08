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

  // Store active realtime channel reference for sending broadcast events
  const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

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

  // Subscribe to both Postgres Changes and Broadcast events on room_messages
  React.useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channelName = `room_chat:${roomId}`;

    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (!newMsg || !newMsg.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

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
          handleIncomingMessage(payload.new as ChatMessage);
        }
      )
      .on(
        "broadcast",
        { event: "chat_message" },
        (payload) => {
          if (payload?.payload) {
            handleIncomingMessage(payload.payload as ChatMessage);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
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
      const newMsg = res.message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Instantly broadcast to all connected room members over WebSocket
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "chat_message",
          payload: newMsg,
        });
      }
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
