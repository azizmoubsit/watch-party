-- Migration: Create SECURITY DEFINER RPC function for room lookup by code or ID
CREATE OR REPLACE FUNCTION public.get_room_by_code(p_code TEXT)
RETURNS SETOF public.rooms
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.rooms
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code))
     OR id::text = TRIM(p_code);
$$;

GRANT EXECUTE ON FUNCTION public.get_room_by_code(TEXT) TO authenticated, anon;
