# Feature 11 — YouTube Provider Adapter

## Goal
Add YouTube using the official embedded player/API, without changing synchronization logic.

## Depends on
05-VIDEO-PLAYER, 06-REALTIME-SYNC, 07-ROLES-PERMISSIONS

## Scope
Create a `YoutubeVideoController` that conforms to `VideoController`.
Map:
- play
- pause
- seek
- current time
- duration
- load source
- destroy

Extract/validate a supported YouTube video ID or canonical URL form.

## Synchronization requirement
Room code must remain provider-agnostic.
A `PLAY` event should not contain YouTube-specific API calls.

## Browser behavior
Handle player readiness and autoplay restrictions.
Do not assume the player is immediately ready after mounting.

## Acceptance criteria
Two browsers in the same room can synchronize play/pause/seek for the same YouTube source.
Changing the source loads the new video for authorized users.
Unauthorized roles cannot change the source.
