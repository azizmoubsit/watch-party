import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types/room";

export interface UpdatePlaybackResult {
  success: boolean;
  room?: Room;
  error?: string;
}

export async function updateRoomPlaybackStateAction(params: {
  roomId: string;
  status: "playing" | "paused";
  position: number;
}): Promise<UpdatePlaybackResult> {
  const supabase = createClient();

  const { data: currentRoom, error: fetchError } = await supabase
    .from("rooms")
    .select("version")
    .eq("id", params.roomId)
    .single();

  if (fetchError || !currentRoom) {
    return { success: false, error: "Room not found." };
  }

  const newVersion = (currentRoom.version || 0) + 1;
  const nowIso = new Date().toISOString();

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      playback_status: params.status,
      playback_position: Math.max(0, params.position),
      changed_at: nowIso,
      version: newVersion,
      updated_at: nowIso,
    })
    .eq("id", params.roomId)
    .select()
    .single();

  if (updateError || !updatedRoom) {
    console.error("Failed to update room playback state:", updateError);
    return { success: false, error: "Failed to update room playback state." };
  }

  return { success: true, room: updatedRoom as Room };
}

export async function updateRoomSourceAction(params: {
  roomId: string;
  sourceUrl: string;
  sourceType: "mp4" | "hls" | "youtube";
}): Promise<UpdatePlaybackResult> {
  const supabase = createClient();

  const { data: currentRoom, error: fetchError } = await supabase
    .from("rooms")
    .select("version")
    .eq("id", params.roomId)
    .single();

  if (fetchError || !currentRoom) {
    return { success: false, error: "Room not found." };
  }

  const newVersion = (currentRoom.version || 0) + 1;
  const nowIso = new Date().toISOString();

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      source_url: params.sourceUrl,
      source_type: params.sourceType,
      playback_status: "paused",
      playback_position: 0.0,
      changed_at: nowIso,
      version: newVersion,
      updated_at: nowIso,
    })
    .eq("id", params.roomId)
    .select()
    .single();

  if (updateError || !updatedRoom) {
    console.error("Failed to update room source:", updateError);
    return { success: false, error: "Failed to update video source." };
  }

  return { success: true, room: updatedRoom as Room };
}
