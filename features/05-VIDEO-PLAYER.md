# Feature 05 — Video Player Abstraction

## Goal
Build a provider-neutral player layer and a baseline native HTML5 player.

## Depends on
04-ROOMS

## Scope
Create types such as:
- VideoSource
- VideoSourceType
- VideoController
- PlayerState

Initial provider:
- direct MP4
- direct HLS where supported by the browser/runtime; use an HLS adapter only if needed by requirements

## VideoController
Support:
- play
- pause
- seek
- current time
- duration
- load source
- destroy
- event callbacks for user actions

## Important
The player must distinguish user-generated events from state applied by synchronization.
Prevent programmatic `seek/pause/play` from generating a new outbound room command.

## UX
Handle:
- autoplay rejection
- source loading
- buffering
- media errors
- unsupported formats
- seeking

## Acceptance criteria
A local test MP4 can be played/paused/seeked through the abstraction without the room synchronization code knowing browser-specific details.
