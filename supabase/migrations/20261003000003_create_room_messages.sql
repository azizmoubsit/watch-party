-- Migration 03: Create room_messages table for optional room chat
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages(room_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow room members to read messages"
  ON public.room_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_room_member(room_id, auth.uid())
  );

CREATE POLICY "Allow room members to send messages"
  ON public.room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND public.is_room_member(room_id, auth.uid())
  );
