# Feature 13 — Owner Analytics

## Goal
Provide useful room-level analytics to the owner without building a full analytics platform.

## Depends on
09-WATCH-TIME, 12-ROOM-SETTINGS

## Metrics
- unique participants
- current participant count
- total active watch time
- average active session duration
- per-user watch time
- room creation time
- latest activity

## UX
Owner-only page/section.
Simple tables/cards are sufficient.

## Security
Never expose analytics from other rooms.
RLS or a secure server-side query must enforce room ownership/membership rules.

## Acceptance criteria
Owner sees analytics for their rooms. Viewer cannot access owner analytics.
