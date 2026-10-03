# Feature 12 — Room Settings

## Goal
Add owner-controlled room configuration.

## Depends on
07-ROLES-PERMISSIONS, 11-YOUTUBE

## Suggested settings
- room name
- default role for new members: viewer/controller
- allow controllers to seek: boolean
- allow viewers local pause only: keep false in MVP unless product rules change
- room visibility/access mode if needed

Keep settings small. Do not create a generic JSON settings blob unless there is a real need.

## Acceptance criteria
Settings persist, are RLS-protected, update UI immediately after save, and take effect for subsequent actions.
