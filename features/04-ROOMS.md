# Feature 04 — Rooms

## Goal
Create and join watch rooms with persistent state.

## Depends on
03-AUTH-PROFILE

## Database
Create migrations for:
- rooms
- room_members

Room fields should cover:
- id
- short unique room code
- owner_id
- source_type
- source
- playback status
- playback position
- changed_at
- version
- timestamps

Membership fields:
- room_id
- user_id
- role
- display_name snapshot if useful
- joined_at
- last_seen_at

Use UUID primary keys.

## Features
- Create room.
- Join by code.
- Join by URL.
- Room not found handling.
- Duplicate/rejoin behavior.
- Owner membership creation.
- Basic room page at `/room/[roomId]` or equivalent.

## Security
- RLS enabled.
- Only members can read protected room state.
- Only authorized roles can mutate protected fields.
- Never trust room code alone for access to protected data.

## Acceptance criteria
Two separate browser sessions can create/join the same room and see the same persisted room state.
