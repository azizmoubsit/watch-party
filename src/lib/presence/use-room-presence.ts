"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { RoomRole } from "@/types/room";
import type { PresenceState } from "./types";

export interface UseRoomPresenceProps {
  roomId: string | undefined;
  userId: string | undefined;
  displayName: string;
  role: RoomRole;
}

export function useRoomPresence({
  roomId,
  userId,
  displayName,
  role,
}: UseRoomPresenceProps) {
  const [onlineUsers, setOnlineUsers] = React.useState<PresenceState[]>([]);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  const infoRef = React.useRef({ displayName, role });
  React.useEffect(() => {
    infoRef.current = { displayName, role };
    if (channelRef.current && userId) {
      channelRef.current.track({
        userId,
        displayName: displayName || "Anonymous User",
        role,
        joinedAt: Date.now(),
        onlineAt: Date.now(),
      });
    }
  }, [displayName, role, userId]);

  React.useEffect(() => {
    if (!roomId || !userId) return;

    const supabase = createClient();
    const channelName = `room_presence:${roomId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const presentList: PresenceState[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            presentList.push(presences[0]);
          }
        });

        setOnlineUsers(presentList);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Member joined room presence:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Member left room presence:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            displayName: infoRef.current.displayName || "Anonymous User",
            role: infoRef.current.role,
            joinedAt: Date.now(),
            onlineAt: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId]);

  const isUserOnline = (checkUserId: string): boolean => {
    return onlineUsers.some((u) => u.userId === checkUserId);
  };

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.length,
  };
}
