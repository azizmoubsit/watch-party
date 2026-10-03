# Feature 03 — Anonymous Auth + Profile

## Goal
Give every visitor an authenticated identity while keeping onboarding friction low.

## Depends on
01-BOOTSTRAP, 02-FOUNDATION-UI

## Architecture
Use Supabase anonymous authentication for MVP.
Store a small display name in user metadata or an application profile structure, whichever is cleaner for RLS and future migration to permanent auth.

## UX
First visit:
1. Authenticate anonymously if no session exists.
2. Ask for display name.
3. Persist it.
4. Continue to app.

Handle:
- existing session
- failed anonymous sign-in
- invalid display name
- cleared browser storage

## Security
Do not use anonymous authentication as a reason to weaken RLS. Anonymous users still need room membership checks.

## Acceptance criteria
- User gets a stable Supabase user ID during the browser session.
- Display name is sanitized/validated.
- Session survives normal refresh.
- Server-side code can identify the user.
- No secrets are sent to the browser.
