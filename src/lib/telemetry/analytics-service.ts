import { createClient } from "@/lib/supabase/client";
import type { RoomAnalytics, UserAnalyticsSummary } from "./analytics-types";

export async function fetchRoomAnalyticsAction(roomId: string): Promise<{
  success: boolean;
  analytics?: RoomAnalytics;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  // 1. Fetch room details
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, title, code, owner_id, created_at, updated_at")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return { success: false, error: "Room not found." };
  }

  // 2. Enforce Owner Security Rule
  if (room.owner_id !== userId) {
    return {
      success: false,
      error: "Access denied. Room analytics are strictly restricted to the room owner.",
    };
  }

  // 3. Fetch room members
  const { data: members, error: membersError } = await supabase
    .from("room_members")
    .select("user_id, display_name, role, joined_at, last_seen_at")
    .eq("room_id", roomId);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  // 4. Fetch watch sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("watch_sessions")
    .select("user_id, duration_seconds, session_start, last_heartbeat")
    .eq("room_id", roomId);

  if (sessionsError) {
    return { success: false, error: sessionsError.message };
  }

  // Calculate aggregates
  let totalWatchTimeSeconds = 0;
  const totalSessions = sessions?.length || 0;
  const userSessionMap = new Map<string, { duration: number; count: number }>();

  (sessions || []).forEach((s) => {
    const dur = s.duration_seconds || 0;
    totalWatchTimeSeconds += dur;

    const existing = userSessionMap.get(s.user_id) || { duration: 0, count: 0 };
    userSessionMap.set(s.user_id, {
      duration: existing.duration + dur,
      count: existing.count + 1,
    });
  });

  const avgSessionDurationSeconds =
    totalSessions > 0 ? Math.round(totalWatchTimeSeconds / totalSessions) : 0;

  // Compute online threshold (last 2 minutes)
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  let currentOnlineCount = 0;

  const userSummaries: UserAnalyticsSummary[] = (members || []).map((m) => {
    const stats = userSessionMap.get(m.user_id) || { duration: 0, count: 0 };
    if (m.last_seen_at >= twoMinutesAgo) {
      currentOnlineCount++;
    }

    return {
      userId: m.user_id,
      displayName: m.display_name || "Anonymous User",
      role: m.role,
      totalWatchTimeSeconds: stats.duration,
      sessionCount: stats.count,
      joinedAt: m.joined_at,
      lastSeenAt: m.last_seen_at,
    };
  });

  // Sort users by total watch time descending
  userSummaries.sort((a, b) => b.totalWatchTimeSeconds - a.totalWatchTimeSeconds);

  const analytics: RoomAnalytics = {
    roomId: room.id,
    title: room.title,
    code: room.code,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    totalParticipants: members?.length || 0,
    currentOnlineCount,
    totalWatchTimeSeconds,
    avgSessionDurationSeconds,
    totalSessions,
    userSummaries,
  };

  return { success: true, analytics };
}
