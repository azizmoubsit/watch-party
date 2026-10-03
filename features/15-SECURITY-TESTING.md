# Feature 15 — Security, Reliability and Testing Hardening

## Goal
Turn the MVP into a trustworthy application.

## Audit
Review:
- every exposed table
- every RLS policy
- Realtime private-channel authorization
- owner/controller/viewer actions
- server actions/routes
- input validation
- source URL validation
- rate limiting opportunities
- secret handling
- error messages
- logs
- XSS risks in display names/chat

## Tests
Add or strengthen:
- permission matrix tests
- stale-event tests
- duplicate-event tests
- reconnect tests
- watch-session lifecycle tests
- invalid-input tests
- RLS tests where practical
- critical end-to-end flows

## Acceptance criteria
A malicious client cannot use the normal public client key/session to read or mutate another user's protected room data outside allowed policies.
Playback synchronization remains stable under reconnects and rapid controls.
