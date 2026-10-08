import { z } from "zod";

export type RoomEventType = "PLAY" | "PAUSE" | "SEEK" | "CHANGE_SOURCE" | "ROLE_UPDATE";

export const roomSyncEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PLAY"),
    roomId: z.string().uuid(),
    version: z.number().int().positive(),
    position: z.number().min(0),
    timestamp: z.number(),
    senderId: z.string(),
  }),
  z.object({
    type: z.literal("PAUSE"),
    roomId: z.string().uuid(),
    version: z.number().int().positive(),
    position: z.number().min(0),
    timestamp: z.number(),
    senderId: z.string(),
  }),
  z.object({
    type: z.literal("SEEK"),
    roomId: z.string().uuid(),
    version: z.number().int().positive(),
    position: z.number().min(0),
    timestamp: z.number(),
    senderId: z.string(),
  }),
  z.object({
    type: z.literal("CHANGE_SOURCE"),
    roomId: z.string().uuid(),
    version: z.number().int().positive(),
    sourceUrl: z.string().url(),
    sourceType: z.enum(["mp4", "hls", "youtube"]),
    timestamp: z.number(),
    senderId: z.string(),
  }),
  z.object({
    type: z.literal("ROLE_UPDATE"),
    roomId: z.string().uuid(),
    targetUserId: z.string(),
    newRole: z.enum(["owner", "controller", "viewer"]),
    timestamp: z.number(),
    senderId: z.string(),
  }),
]);

export type RoomSyncEvent = z.infer<typeof roomSyncEventSchema>;
