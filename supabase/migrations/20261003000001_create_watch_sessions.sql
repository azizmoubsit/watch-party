-- Create watch_sessions table
CREATE TABLE IF NOT EXISTS public.watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  watched_seconds INT4 NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_watch_sessions_room_user ON public.watch_sessions(room_id, user_id);

-- Enable RLS
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watch_sessions
CREATE POLICY "Allow members to view watch sessions"
  ON public.watch_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Allow users to create watch sessions"
  ON public.watch_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their watch sessions"
  ON public.watch_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
