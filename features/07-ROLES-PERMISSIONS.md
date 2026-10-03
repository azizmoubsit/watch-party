# Feature 07 — Roles and Permissions

## Goal
Implement owner/controller/viewer authorization for room actions.

## Depends on
04-ROOMS, 06-REALTIME-SYNC

## Permissions
Owner:
- play
- pause
- seek
- change source
- manage member roles
- remove members

Controller:
- play
- pause
- seek

Viewer:
- watch only

## Requirements
Build a reusable permission model:
`can(user, action, roomContext)`.

UI must hide/disable unauthorized controls.
Server/database/realtime authorization must also reject unauthorized actions.

## Acceptance criteria
- Viewer cannot pause/seek via UI.
- Viewer cannot bypass UI with a direct request.
- Controller cannot change source.
- Controller cannot change roles.
- Only owner can manage membership.
- Unauthorized Realtime publish/subscribe attempts fail safely.
