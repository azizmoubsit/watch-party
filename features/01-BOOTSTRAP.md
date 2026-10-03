# Feature 01 — Bootstrap

## Goal
Create a clean production-ready Next.js foundation for Watch Party.

## Depends on
None.

## Scope
- Create Next.js App Router project if repository is empty.
- TypeScript strict.
- Tailwind CSS.
- ESLint.
- Path alias `@/*`.
- Environment variable validation strategy.
- Basic folder structure.
- Base layout and app metadata.
- Basic error/loading/not-found boundaries where appropriate.
- Supabase packages installed but do not implement full application behavior yet.

## Requirements
- Use current stable Next.js compatible with the project's Node version.
- Keep Node >= the version required by the selected Next.js release.
- Create `.env.example` documenting public Supabase variables without secrets.
- Do not commit secrets.
- Add a minimal README with local setup.
- Add scripts for dev, build, start, lint, and typecheck if missing.

## Acceptance criteria
- Fresh install works.
- `npm/pnpm install` succeeds.
- dev server starts.
- build succeeds.
- lint succeeds.
- typecheck succeeds.
- `/` renders a minimal Watch Party landing page.

## Do not implement yet
- rooms
- realtime
- watch tracking
- provider integrations
- authentication flow beyond package/config preparation
