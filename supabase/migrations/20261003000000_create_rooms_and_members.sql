-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'mp4',
  source_url TEXT NOT NULL DEFAULT '',
  playback_status TEXT NOT NULL DEFAULT 'paused',
  playback_position FLOAT8 NOT NULL DEFAULT 0.0,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT8 NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'controller', 'viewer')),
  display_name TEXT NOT NULL DEFAULT '',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_room_user UNIQUE (room_id, user_id)
);

-- Indexes for efficient RLS and lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check membership
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

-- RLS Policies for rooms
CREATE POLICY "Allow authenticated users to read rooms"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create rooms"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow owners and controllers to update rooms"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_id = public.rooms.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'controller')
    )
  );

-- RLS Policies for room_members
CREATE POLICY "Allow members to view co-members in their rooms"
  ON public.room_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_room_member(room_id, auth.uid()) OR user_id = auth.uid()
  );

CREATE POLICY "Allow authenticated users to join rooms"
  ON public.room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own membership or owner to update role"
  ON public.room_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_id = public.room_members.room_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );
