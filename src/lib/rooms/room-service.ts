import { createClient } from "@/lib/supabase/client";
import type { Room, RoomMember, RoomRole } from "@/types/room";

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WP-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface CreateRoomResult {
  success: boolean;
  room?: Room;
  member?: RoomMember;
  error?: string;
}

export interface JoinRoomResult {
  success: boolean;
  room?: Room;
  member?: RoomMember;
  error?: string;
}

async function ensureUserSession(supabase: ReturnType<typeof createClient>): Promise<{ userId: string | null; error?: string }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }

  if (sessionError) {
    console.warn("Session error, attempting anonymous sign-in fallback:", sessionError.message);
  }

  // Attempt auto anonymous sign-in fallback
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError) {
    console.error("Anonymous auth error:", anonError.message);
    return {
      userId: null,
      error: "Authentication failed. Please try again or refresh the page.",
    };
  }

  return { userId: anonData.user?.id || null };
}

export async function createRoomAction(params: {
  title: string;
  displayName: string;
  sourceUrl?: string;
}): Promise<CreateRoomResult> {
  const supabase = createClient();

  const { userId, error: authErr } = await ensureUserSession(supabase);
  if (!userId) {
    return {
      success: false,
      error: authErr || "You must be signed in to create a room.",
    };
  }

  const roomCode = generateRoomCode();

  // Determine initial source type
  let sourceType: "mp4" | "hls" | "youtube" = "mp4";
  const url = params.sourceUrl?.trim() || "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    sourceType = "youtube";
  } else if (url.endsWith(".m3u8")) {
    sourceType = "hls";
  }

  // Insert room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code: roomCode,
      title: params.title.trim(),
      owner_id: userId,
      source_type: sourceType,
      source_url: url,
      playback_status: "paused",
      playback_position: 0.0,
      version: 1,
      default_role: "viewer",
      allow_controller_seek: true,
    })
    .select()
    .single();

  if (roomError || !room) {
    console.error("Error creating room:", roomError);
    return { success: false, error: roomError?.message || "Failed to create room." };
  }

  // Insert room membership as owner
  const { data: member, error: memberError } = await supabase
    .from("room_members")
    .insert({
      room_id: room.id,
      user_id: userId,
      role: "owner" as RoomRole,
      display_name: params.displayName.trim(),
    })
    .select()
    .single();

  if (memberError || !member) {
    console.error("Error creating room member:", memberError);
    return { success: false, error: memberError?.message || "Failed to create room membership." };
  }

  return { success: true, room: room as Room, member: member as RoomMember };
}

async function findRoomByIdOrCode(
  supabase: ReturnType<typeof createClient>,
  rawInput: string
): Promise<Room | null> {
  const cleanInput = rawInput.trim();
  if (!cleanInput) return null;

  // 1. Try RPC function first (bypasses table RLS for room lookup)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_room_by_code", { p_code: cleanInput });
    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData[0] as Room;
    }
  } catch (e) {
    console.warn("RPC get_room_by_code fallback to standard query:", e);
  }

  // 2. Standard table query fallback
  let query = supabase.from("rooms").select();
  if (isUUID(cleanInput)) {
    query = query.eq("id", cleanInput);
  } else {
    let code = cleanInput.toUpperCase();
    if (!code.startsWith("WP-") && code.length === 4) {
      code = "WP-" + code;
    }
    query = query.eq("code", code);
  }

  const { data: rooms } = await query;
  if (rooms && rooms.length > 0) {
    return rooms[0] as Room;
  }

  return null;
}

export async function joinRoomByCodeAction(params: {
  code: string;
  displayName: string;
}): Promise<JoinRoomResult> {
  const supabase = createClient();

  const { userId, error: authErr } = await ensureUserSession(supabase);
  if (!userId) {
    return {
      success: false,
      error: authErr || "You must be signed in to join a room.",
    };
  }

  const room = await findRoomByIdOrCode(supabase, params.code);

  if (!room) {
    return { success: false, error: "Room not found. Please verify the room code or link." };
  }

  // Check if member already exists to preserve custom role
  const { data: existingMember } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", room.id)
    .eq("user_id", userId)
    .maybeSingle();

  const initialRole: RoomRole = existingMember?.role
    ? (existingMember.role as RoomRole)
    : room.owner_id === userId
    ? "owner"
    : (room.default_role || "viewer");

  // Upsert room membership
  const { data: member, error: memberError } = await supabase
    .from("room_members")
    .upsert(
      {
        room_id: room.id,
        user_id: userId,
        role: initialRole,
        display_name: params.displayName.trim(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    )
    .select()
    .single();

  if (memberError || !member) {
    console.error("Error joining room:", memberError);
    return { success: false, error: memberError?.message || "Failed to join room." };
  }

  return { success: true, room, member: member as RoomMember };
}

export async function updateRoomSettingsAction(params: {
  roomId: string;
  title: string;
  defaultRole: "controller" | "viewer";
  allowControllerSeek: boolean;
}): Promise<{ success: boolean; room?: Room; error?: string }> {
  const supabase = createClient();

  const { userId, error: authErr } = await ensureUserSession(supabase);
  if (!userId) {
    return { success: false, error: authErr || "Authentication required." };
  }

  // Check if current user is owner
  const { data: member } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", params.roomId)
    .eq("user_id", userId)
    .single();

  if (!member || member.role !== "owner") {
    return { success: false, error: "Only room owners can update room settings." };
  }

  const { data: updatedRoom, error } = await supabase
    .from("rooms")
    .update({
      title: params.title.trim(),
      default_role: params.defaultRole,
      allow_controller_seek: params.allowControllerSeek,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.roomId)
    .select()
    .single();

  if (error || !updatedRoom) {
    return { success: false, error: error?.message || "Failed to update room settings." };
  }

  return { success: true, room: updatedRoom as Room };
}

export async function fetchRoomWithMembership(roomId: string) {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const room = await findRoomByIdOrCode(supabase, roomId);

  if (!room) {
    return { room: null, member: null, members: [], error: "Room not found." };
  }

  const { data: members } = await supabase
    .from("room_members")
    .select()
    .eq("room_id", room.id);

  const currentMember = (members || []).find((m) => m.user_id === userId) || null;

  return {
    room,
    member: currentMember as RoomMember | null,
    members: (members || []) as RoomMember[],
    error: null,
  };
}
