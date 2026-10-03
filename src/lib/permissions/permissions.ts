import type { RoomRole } from "@/types/room";

export type RoomAction =
  | "play"
  | "pause"
  | "seek"
  | "change_source"
  | "manage_roles"
  | "remove_member"
  | "close_room"
  | "manage_settings";

export interface PermissionContext {
  allowControllerSeek?: boolean;
}

export function can(
  role: RoomRole | undefined | null,
  action: RoomAction,
  context?: PermissionContext
): boolean {
  if (!role) return false;

  switch (action) {
    case "play":
    case "pause":
      return role === "owner" || role === "controller";

    case "seek":
      if (role === "owner") return true;
      if (role === "controller") {
        return context?.allowControllerSeek !== false;
      }
      return false;

    case "change_source":
    case "manage_roles":
    case "remove_member":
    case "close_room":
    case "manage_settings":
      return role === "owner";

    default:
      return false;
  }
}
