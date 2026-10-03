# Feature 09 — Watch Time and Sessions

## Goal
Track approximate room participation and active watch time.

## Depends on
03-AUTH-PROFILE, 04-ROOMS, 08-PRESENCE

## Database
Create `watch_sessions` migration.
Suggested fields:
- id
- room_id
- user_id
- joined_at
- last_heartbeat_at
- left_at
- watched_seconds

## Behavior
Start a session when joining.
Heartbeat approximately every 20–30 seconds while active.
Use Page Visibility API to pause active-time accumulation when the page is hidden.
Attempt cleanup on page lifecycle events but do not rely on it exclusively.

## Metrics
At minimum calculate:
- session duration
- approximate active watch seconds
- total watch time by user for a room

Avoid writing a row for every second.

## Acceptance criteria
A user who watches for approximately 10 minutes has a recorded session close to 10 active minutes, allowing small measurement error.
Backgrounded tabs should not keep accumulating active watch time.
