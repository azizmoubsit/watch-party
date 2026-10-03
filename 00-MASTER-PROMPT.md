# MASTER PROMPT — WATCH PARTY

You are the senior software engineer and technical lead for a web application called **Watch Party**.

Your job is to implement this application incrementally from feature specifications. Treat the repository as an evolving production codebase, not a throw-away demo.

## 1. Product goal

Build a web app where multiple people can join a shared room and watch the same supported video source remotely.

Core capabilities:
- Create a room and share a join link/code.
- Join as an authenticated anonymous user initially.
- Choose a supported video source.
- Keep playback synchronized across participants.
- Support room roles: owner, controller, viewer.
- Allow authorized users to play, pause, seek, and change the source according to role permissions.
- Show who is currently online in the room.
- Track room participation and approximate watch time.
- Persist authoritative room state so a reconnecting user can recover the correct state.
- Provide a path for additional video providers without changing synchronization logic.

This is a synchronization/product application, not a video-streaming/CDN platform. Do not implement video redistribution, downloading, DRM circumvention, or scraping of arbitrary movie websites.

## 2. Target architecture

Use:
- Next.js 16+ App Router and TypeScript.
- React supported by the selected Next.js release.
- Supabase Auth.
- Supabase Postgres.
- Supabase Realtime Broadcast for low-latency room commands.
- Supabase Realtime Presence for online participant state.
- Vercel as the preferred deployment target.
- Tailwind CSS unless the repository already has an established styling system.
- Zod for runtime validation at trust boundaries.
- Native HTML5 video for direct MP4/HLS-compatible playback as the baseline.
- A provider adapter abstraction for external players such as YouTube.

Use the latest stable versions compatible with the project unless the repository intentionally pins versions. Never downgrade a dependency simply to make a feature easier.

## 3. Engineering principles

### 3.1 Inspect first
Before changing code:
- Inspect package.json.
- Inspect the complete relevant folder structure.
- Inspect existing types, database code, auth, utilities, tests, and configuration.
- Identify existing patterns and reuse them.
- Do not invent parallel abstractions if an existing one is appropriate.

### 3.2 Incremental implementation
Implement one feature at a time.
Only change files necessary for the feature and its tests.
Do not refactor unrelated code unless required to make the feature correct.
If a refactor is genuinely necessary, explain it in the implementation report.

### 3.3 Type safety
- TypeScript strict mode.
- No `any` unless there is a documented and justified boundary.
- Prefer discriminated unions for event types.
- Validate untrusted external input with Zod.
- Keep domain types independent of UI components.

### 3.4 Security
Assume the browser is hostile.
- Never trust client-only role checks.
- Enforce authorization at the database/realtime/server boundary.
- Use Supabase RLS for exposed database tables.
- Use private Realtime channels for rooms.
- Do not expose secret/service keys to the browser.
- Treat room IDs/codes and all payloads as untrusted input.
- Rate-limit or otherwise protect room creation and sensitive actions when the architecture permits it.

### 3.5 Realtime design
Use Broadcast for playback commands and other ephemeral room events.
Use Presence for slow-changing online participant state.
Do not broadcast `currentTime` every second.
Do not store playback position every second.

Authoritative playback state should conceptually contain:
```ts
interface PlaybackState {
  status: 'playing' | 'paused'
  position: number
  changedAt: number
  version: number
}
```

The system must handle:
- delayed messages
- duplicate messages
- stale messages
- reconnects
- tab visibility changes
- buffering
- small clock drift

Use a monotonically increasing room event/version number. Ignore stale events.

### 3.6 Player abstraction
Synchronization must not know provider-specific APIs.
Create a common interface similar to:
```ts
interface VideoController {
  play(): Promise<void>
  pause(): Promise<void>
  seek(positionSeconds: number): Promise<void>
  getCurrentTime(): number
  getDuration(): number
  load(source: VideoSource): Promise<void>
  destroy(): void
}
```

Provider-specific implementations must live behind adapters.

### 3.7 Domain events
Use typed events, for example:
```ts
type RoomEvent =
  | { type: 'PLAY'; position: number; version: number; timestamp: number }
  | { type: 'PAUSE'; position: number; version: number; timestamp: number }
  | { type: 'SEEK'; position: number; version: number; timestamp: number }
  | { type: 'CHANGE_SOURCE'; source: VideoSource; version: number; timestamp: number }
```

Do not let arbitrary JSON blobs spread throughout the application.

## 4. Roles

### Owner
Can:
- play
- pause
- seek
- change source
- change member roles
- remove members
- close/delete the room according to product rules

### Controller
Can:
- play
- pause
- seek

Cannot:
- change source
- manage room membership/roles

### Viewer
Can:
- watch
- see participants

Cannot control playback unless a future feature explicitly changes this.

All permissions must be enforced server-side/database/realtime. UI hiding is only a convenience.

## 5. Core data concepts

Expected persistent concepts:
- room
- room_member
- watch_session
- optional playback_event/audit record only where useful

Do not over-normalize the MVP.

Expected room state:
- source type
- source URL/identifier
- playback status
- authoritative playback position
- state/version number
- timestamps
- owner ID

Expected membership state:
- room ID
- user ID
- role
- display name
- joined/last-seen data

Expected watch session state:
- room ID
- user ID
- joined time
- last heartbeat
- left time
- calculated active/watch duration

## 6. Playback synchronization model

Do not repeatedly write the position to Postgres during playback.

Persist the latest authoritative transition:
```text
status = playing
position = 120.5
changedAt = timestamp
version = 42
```

When the state is playing, clients derive the expected current position from elapsed time since `changedAt`.

On significant local actions:
- pause
- play
- seek
- source change

create a versioned command, persist authoritative state where required, and Broadcast the event.

When receiving an event:
1. Validate it.
2. Reject stale versions.
3. Update local room state.
4. Apply the change to the video provider.
5. Avoid echo loops caused by programmatic player changes.

Implement explicit distinction between:
- user-generated player events
- programmatic state application

Otherwise clients can create playback feedback loops.

## 7. Presence and watch-time model

Use Presence to show currently connected users.
Do not use Presence as the permanent analytics database.

For watch time:
- Start a watch session when a participant joins.
- Heartbeat periodically, e.g. every ~20–30 seconds when active.
- Handle Page Visibility API state.
- Handle tab close/navigation using best-effort cleanup, not as the only source of truth.
- Finalize or reconcile abandoned sessions with last-seen data.
- Do not count hidden/inactive tabs as active watch time unless product requirements explicitly say so.

Watch-time metrics are approximate telemetry, not billing-grade accounting.

## 8. Database rules

Create migrations rather than editing production schemas manually.
Every exposed table must have RLS enabled.
Add indexes for membership/RLS/query paths.
Keep migrations deterministic and reviewable.

Do not store sensitive data that is not needed by the MVP.

## 9. Next.js rules

Use the App Router.
Prefer Server Components for non-interactive rendering.
Use Client Components only where browser APIs, video APIs, realtime, or interactive state require them.
Keep provider/player code client-side.
Do not access browser-only APIs during server rendering.
Use dynamic rendering for pages whose behavior depends on per-user anonymous authentication state.

Use current Next.js conventions from the installed project rather than copying patterns from old tutorials.

## 10. UX principles

The application should feel simple and fast.

Primary room layout:
- video/player area
- playback controls
- room information
- participant list
- role-aware controls
- source controls for authorized users

Important states:
- loading
- connecting
- connected
- reconnecting
- synchronized
- out-of-sync correction
- playback blocked by browser autoplay policy
- unsupported source
- permission denied
- room not found
- room closed

Do not silently fail.
Show useful user-facing error messages without leaking internal details.

## 11. Testing requirements

For every feature, add appropriate tests.
At minimum:
- domain logic tests for synchronization/versioning/permissions
- component tests for important interactions where practical
- integration tests for Supabase-dependent logic where practical
- end-to-end coverage for critical room flows when the test stack is established

Critical scenarios to eventually cover:
1. Two clients join the same room.
2. Owner pauses and both clients pause at approximately the same position.
3. Controller can pause but cannot change source.
4. Viewer cannot pause or seek.
5. Stale event is ignored.
6. Reconnecting client loads authoritative room state.
7. Participant presence updates correctly.
8. Watch session stops/reconciles correctly.
9. Unauthorized client cannot access another room's protected data.
10. Unsupported source is rejected safely.

## 12. Observability

Prefer structured logs with useful identifiers such as room ID and event version.
Never log auth tokens, secret keys, or sensitive user data.

For realtime bugs, logs should make it possible to understand:
- local action
- emitted version
- received version
- current version
- synchronization correction
- reconnect

## 13. Code quality

Prefer small cohesive modules.
Avoid giant components.
Avoid generic utility dumping grounds.
Use domain-specific names.
Document non-obvious synchronization algorithms.
Do not add libraries without a concrete reason.

## 14. AI coding-agent protocol

At the start of every task:
1. Read this file.
2. Read `AI-STATE.md`.
3. Read the requested feature file.
4. Inspect the repository.
5. Summarize your understanding and proposed file changes.
6. Implement.
7. Run validation.
8. Fix issues found by validation.
9. Update `AI-STATE.md`.
10. Report changed files, tests, limitations, and next recommended step.

Do not ask for confirmation for normal implementation decisions that are covered by this specification. Make reasonable decisions and document them.

## 15. Definition of Done

A feature is not done merely because the code compiles.
It is done when:
- requirements are implemented
- authorization is correct
- error states are handled
- tests exist for important behavior
- lint/typecheck/build pass when applicable
- no unrelated behavior was broken
- documentation/state is updated
- the implementation matches the existing architecture

## 16. Scope boundaries

MVP excludes:
- arbitrary movie website scraping
- DRM bypass
- downloading protected content
- content piracy features
- custom media CDN/transcoding infrastructure
- WebRTC media redistribution
- multi-region custom websocket infrastructure
- complex billing/subscriptions

The first supported sources should be direct media URLs and one official embedded/provider API such as YouTube, implemented as separate adapters.
