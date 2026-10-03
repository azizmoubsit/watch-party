# Feature 14 — Optional Room Chat

## Goal
Add lightweight text chat only after core playback synchronization is stable.

## Depends on
08-PRESENCE, 07-ROLES-PERMISSIONS

## Scope
- send message
- receive message in realtime
- display timestamp/name
- basic rate limiting
- optional message persistence

Use Broadcast for transient messages if persistence is not required. If message history is required, use a chat_messages table with RLS.

Do not let chat code modify playback state.
