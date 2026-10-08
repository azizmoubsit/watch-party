"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types/room";
import type { RoomSyncEvent } from "@/types/sync";
import { roomSyncEventSchema } from "@/types/sync";
import {
  calculateExpectedPosition,
  isStaleVersion,
} from "./sync-engine";
import { updateRoomPlaybackStateAction } from "./sync-service";

import type { RoomRole } from "@/types/room";

export interface UseRoomSyncProps {
  room: Room | null;
  userId: string | undefined;
  canControl: boolean;
  onApplyPlay?: () => void;
  onApplyPause?: () => void;
  onApplySeek?: (positionSeconds: number) => void;
  onRoomStateUpdated?: (updatedRoom: Room) => void;
  onRoleUpdated?: (targetUserId: string, newRole: RoomRole) => void;
}

export function useRoomSync({
  room,
  userId,
  canControl,
  onApplyPlay,
  onApplyPause,
  onApplySeek,
  onRoomStateUpdated,
  onRoleUpdated,
}: UseRoomSyncProps) {
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const currentVersionRef = React.useRef<number>(room?.version || 1);
  const roomRef = React.useRef<Room | null>(room);

  // Keep callbacks stable in ref to prevent channel teardown loops on re-renders
  const callbacksRef = React.useRef({ onApplyPlay, onApplyPause, onApplySeek, onRoomStateUpdated, onRoleUpdated });
  React.useEffect(() => {
    callbacksRef.current = { onApplyPlay, onApplyPause, onApplySeek, onRoomStateUpdated, onRoleUpdated };
  }, [onApplyPlay, onApplyPause, onApplySeek, onRoomStateUpdated, onRoleUpdated]);

  const [isConnected, setIsConnected] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<"synchronized" | "reconnecting" | "drift_correction">("synchronized");

  // Keep refs in sync
  React.useEffect(() => {
    roomRef.current = room;
    if (room?.version) {
      currentVersionRef.current = Math.max(currentVersionRef.current, room.version);
    }
  }, [room]);

  // Subscribe to private Realtime channel ONCE per room/user
  React.useEffect(() => {
    if (!room?.id || !userId) return;

    const supabase = createClient();
    const channelName = `room:${room.id}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
      },
    });

    channel
      .on("broadcast", { event: "ROOM_EVENT" }, ({ payload }) => {
        const validation = roomSyncEventSchema.safeParse(payload);
        if (!validation.success) {
          console.warn("Invalid broadcast event payload received:", validation.error);
          return;
        }

        const event = validation.data as RoomSyncEvent;

        if (event.type === "ROLE_UPDATE") {
          if (callbacksRef.current.onRoleUpdated) {
            callbacksRef.current.onRoleUpdated(event.targetUserId, event.newRole);
          }
          return;
        }

        // Reject stale versions
        if (isStaleVersion(event.version, currentVersionRef.current)) {
          console.log(`Ignoring stale event version ${event.version} <= current ${currentVersionRef.current}`);
          return;
        }

        currentVersionRef.current = event.version;

        const { onApplyPlay: playCb, onApplyPause: pauseCb, onApplySeek: seekCb } = callbacksRef.current;

        if (event.type === "PLAY") {
          const expectedPos = calculateExpectedPosition({
            status: "playing",
            position: event.position,
            changedAt: event.timestamp,
          });

          if (seekCb) seekCb(expectedPos);
          if (playCb) playCb();
        } else if (event.type === "PAUSE") {
          if (seekCb) seekCb(event.position);
          if (pauseCb) pauseCb();
        } else if (event.type === "SEEK") {
          if (seekCb) seekCb(event.position);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setSyncStatus("synchronized");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setSyncStatus("reconnecting");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [room?.id, userId]);

  // User-initiated playback actions
  const broadcastUserPlay = async (currentPosition: number) => {
    if (!roomRef.current || !userId || !canControl) return;

    const result = await updateRoomPlaybackStateAction({
      roomId: roomRef.current.id,
      status: "playing",
      position: currentPosition,
    });

    if (result.success && result.room) {
      currentVersionRef.current = result.room.version;
      if (callbacksRef.current.onRoomStateUpdated) {
        callbacksRef.current.onRoomStateUpdated(result.room);
      }

      const eventPayload: RoomSyncEvent = {
        type: "PLAY",
        roomId: roomRef.current.id,
        version: result.room.version,
        position: currentPosition,
        timestamp: Date.now(),
        senderId: userId,
      };

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ROOM_EVENT",
          payload: eventPayload,
        });
      }
    }
  };

  const broadcastUserPause = async (currentPosition: number) => {
    if (!roomRef.current || !userId || !canControl) return;

    const result = await updateRoomPlaybackStateAction({
      roomId: roomRef.current.id,
      status: "paused",
      position: currentPosition,
    });

    if (result.success && result.room) {
      currentVersionRef.current = result.room.version;
      if (callbacksRef.current.onRoomStateUpdated) {
        callbacksRef.current.onRoomStateUpdated(result.room);
      }

      const eventPayload: RoomSyncEvent = {
        type: "PAUSE",
        roomId: roomRef.current.id,
        version: result.room.version,
        position: currentPosition,
        timestamp: Date.now(),
        senderId: userId,
      };

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ROOM_EVENT",
          payload: eventPayload,
        });
      }
    }
  };

  const broadcastUserSeek = async (newPosition: number) => {
    if (!roomRef.current || !userId || !canControl) return;

    const currentStatus = roomRef.current.playback_status || "paused";

    const result = await updateRoomPlaybackStateAction({
      roomId: roomRef.current.id,
      status: currentStatus,
      position: newPosition,
    });

    if (result.success && result.room) {
      currentVersionRef.current = result.room.version;
      if (callbacksRef.current.onRoomStateUpdated) {
        callbacksRef.current.onRoomStateUpdated(result.room);
      }

      const eventPayload: RoomSyncEvent = {
        type: "SEEK",
        roomId: roomRef.current.id,
        version: result.room.version,
        position: newPosition,
        timestamp: Date.now(),
        senderId: userId,
      };

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ROOM_EVENT",
          payload: eventPayload,
        });
      }
    }
  };

  const broadcastRoleUpdate = (targetUserId: string, newRole: RoomRole) => {
    if (!roomRef.current || !userId) return;

    const eventPayload: RoomSyncEvent = {
      type: "ROLE_UPDATE",
      roomId: roomRef.current.id,
      targetUserId,
      newRole,
      timestamp: Date.now(),
      senderId: userId,
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "ROOM_EVENT",
        payload: eventPayload,
      });
    }
  };

  return {
    isConnected,
    syncStatus,
    broadcastUserPlay,
    broadcastUserPause,
    broadcastUserSeek,
    broadcastRoleUpdate,
  };
}
