# Feature 02 — Foundation UI

## Goal
Create the reusable UI shell without implementing room logic.

## Depends on
01-BOOTSTRAP

## Scope
Create:
- application header
- landing page
- primary buttons/input/select/dialog primitives if needed
- alert/error component
- loading/skeleton patterns
- empty-state component
- responsive container/layout
- accessible focus states

## UX
Landing page should communicate:
- Watch together remotely.
- Create a room.
- Join a room by code/link.

Do not add fake functionality. Buttons that are not implemented should either be clearly disabled or wired only when the target feature exists.

## Acceptance criteria
- Responsive desktop/mobile UI.
- Accessible labels and keyboard navigation.
- No room state hidden in UI components.
- Reusable components do not depend on Supabase.
