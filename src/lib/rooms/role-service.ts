import { createClient } from "@/lib/supabase/client";
import type { RoomRole } from "@/types/room";

export async function updateMemberRoleAction(params: {
  roomId: string;
  targetUserId: string;
  newRole: RoomRole;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: "Not authenticated." };
  }

  // Check if current user is owner
  const { data: room } = await supabase
    .from("rooms")
    .select("owner_id")
    .eq("id", params.roomId)
    .single();

  if (!room || room.owner_id !== session.user.id) {
    return { success: false, error: "Only the Room Owner can update member roles." };
  }

  const { error } = await supabase
    .from("room_members")
    .update({ role: params.newRole })
    .eq("room_id", params.roomId)
    .eq("user_id", params.targetUserId);

  if (error) {
    console.error("Failed to update role:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeMemberAction(params: {
  roomId: string;
  targetUserId: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: "Not authenticated." };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("owner_id")
    .eq("id", params.roomId)
    .single();

  if (!room || room.owner_id !== session.user.id) {
    return { success: false, error: "Only the Room Owner can remove members." };
  }

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", params.roomId)
    .eq("user_id", params.targetUserId);

  if (error) {
    console.error("Failed to remove member:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
