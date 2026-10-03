# Feature 06 — Realtime Playback Synchronization

## Goal
Synchronize playback across room participants.

## Depends on
04-ROOMS, 05-VIDEO-PLAYER

## Realtime
Use a private Supabase Realtime channel per room.
Use Broadcast for playback commands.

## Events
At minimum:
- PLAY
- PAUSE
- SEEK
- CHANGE_SOURCE placeholder for later permission-controlled implementation

Each event must include:
- event type
- room ID or channel context
- version
- source client/user ID if useful
- authoritative position when relevant
- server/client timestamp strategy

## State model
Persist authoritative room state in Postgres at meaningful transitions.
Do not write position every second.

Use monotonically increasing version numbers.
Reject stale events.
Handle duplicate delivery safely.

## Synchronization behavior
When receiving a PLAY/PAUSE/SEEK event:
1. Validate payload.
2. Compare version.
3. Update local room state.
4. Calculate expected position.
5. Apply player state.
6. Mark the application as programmatic so it does not echo back.

While playing, periodically compare local position to expected room position.
Correct only when drift exceeds a small threshold; do not constantly seek.

## Reconnect
After reconnect:
- fetch authoritative persisted room state
- compare local version
- apply latest state
- resubscribe to realtime channel

## Acceptance criteria
With two browser sessions:
- owner play affects both
- owner pause affects both
- owner seek affects both
- rapid sequential events do not regress state
- stale event is ignored
- refresh/reconnect recovers authoritative state
- no infinite event loops
