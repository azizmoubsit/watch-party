import { z } from "zod";

export type RoomRole = "owner" | "controller" | "viewer";

export interface PlaybackState {
  status: "playing" | "paused";
  position: number;
  changedAt: number;
  version: number;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  owner_id: string;
  source_type: "mp4" | "hls" | "youtube";
  source_url: string;
  playback_status: "playing" | "paused";
  playback_position: number;
  changed_at: string;
  version: number;
  default_role?: "controller" | "viewer";
  allow_controller_seek?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: RoomRole;
  display_name: string;
  joined_at: string;
  last_seen_at: string;
}

export const createRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Room title must be at least 3 characters")
    .max(50, "Room title cannot exceed 50 characters"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(30, "Display name cannot exceed 30 characters"),
  sourceUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

export const joinRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Room code or link is required"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(30, "Display name cannot exceed 30 characters"),
});

export const updateRoomSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Room title must be at least 3 characters")
    .max(50, "Room title cannot exceed 50 characters"),
  defaultRole: z.enum(["controller", "viewer"]),
  allowControllerSeek: z.boolean(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomSettingsInput = z.infer<typeof updateRoomSettingsSchema>;
