# Feature 08 — Realtime Presence

## Goal
Show who is currently connected to a room.

## Depends on
04-ROOMS, 06-REALTIME-SYNC

## Implementation
Use Supabase Realtime Presence on the room private channel.
Presence payload should be small, e.g.:
- userId
- displayName
- role
- client/session identifier
- optionally active/visible state

Do not use Presence for durable analytics.
Do not call track at high frequency.

## UX
Participant list should show:
- display name
- role badge
- online state

Handle:
- sync
- join
- leave
- reconnect

## Acceptance criteria
Opening/closing two browser sessions produces correct participant updates without polling.
