# Feature 16 — Deployment

## Goal
Deploy the application to Vercel with Supabase production configuration.

## Scope
- production environment variables
- Supabase production project
- database migrations
- RLS/realtime configuration
- Vercel project
- build command
- preview vs production behavior
- basic observability

## Requirements
- Never commit secrets.
- Use publishable/client-safe Supabase credentials in the browser and secret credentials only in trusted server environments as required by current Supabase guidance.
- Confirm private Realtime channels and RLS are enabled/configured correctly.
- Test production with at least two independent browser sessions.

## Acceptance criteria
Production deployment can:
- create/join a room
- synchronize play/pause/seek
- show presence
- track watch sessions
- enforce roles
- survive refresh/reconnect
