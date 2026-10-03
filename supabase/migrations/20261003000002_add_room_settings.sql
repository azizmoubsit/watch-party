-- Migration 02: Add room settings columns to rooms table
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS default_role TEXT NOT NULL DEFAULT 'viewer' CHECK (default_role IN ('controller', 'viewer')),
  ADD COLUMN IF NOT EXISTS allow_controller_seek BOOLEAN NOT NULL DEFAULT true;
