import { createClient } from "@/lib/supabase/client";

export async function startWatchSessionAction(roomId: string): Promise<{ sessionId?: string; error?: string }> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { error: "User not authenticated." };
  }

  const { data, error } = await supabase
    .from("watch_sessions")
    .insert({
      room_id: roomId,
      user_id: session.user.id,
      joined_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      watched_seconds: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    const errorDetails = error?.message || error?.details || (typeof error === "object" ? JSON.stringify(error) : String(error));
    console.error("Failed to start watch session:", errorDetails);
    return { error: error?.message || "Failed to create session." };
  }

  return { sessionId: data.id };
}

export async function heartbeatWatchSessionAction(params: {
  sessionId: string;
  incrementalSeconds: number;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // Fetch current watched_seconds to increment
  const { data: currentSession } = await supabase
    .from("watch_sessions")
    .select("watched_seconds")
    .eq("id", params.sessionId)
    .single();

  const existingSeconds = currentSession?.watched_seconds || 0;
  const newTotalSeconds = existingSeconds + Math.max(0, params.incrementalSeconds);

  const { error } = await supabase
    .from("watch_sessions")
    .update({
      last_heartbeat_at: nowIso,
      watched_seconds: newTotalSeconds,
      updated_at: nowIso,
    })
    .eq("id", params.sessionId);

  if (error) {
    console.error("Failed to heartbeat watch session:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function endWatchSessionAction(params: {
  sessionId: string;
  incrementalSeconds: number;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const { data: currentSession } = await supabase
    .from("watch_sessions")
    .select("watched_seconds")
    .eq("id", params.sessionId)
    .single();

  const existingSeconds = currentSession?.watched_seconds || 0;
  const newTotalSeconds = existingSeconds + Math.max(0, params.incrementalSeconds);

  const { error } = await supabase
    .from("watch_sessions")
    .update({
      left_at: nowIso,
      last_heartbeat_at: nowIso,
      watched_seconds: newTotalSeconds,
      updated_at: nowIso,
    })
    .eq("id", params.sessionId);

  if (error) {
    console.error("Failed to end watch session:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
