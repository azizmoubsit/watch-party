import type { RoomRole } from "@/types/room";

export interface PresenceState {
  userId: string;
  displayName: string;
  role: RoomRole;
  joinedAt: number;
  onlineAt: number;
}
