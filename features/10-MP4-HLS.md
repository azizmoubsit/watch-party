# Feature 10 — Direct Media Sources

## Goal
Harden support for direct video URLs.

## Depends on
05-VIDEO-PLAYER, 06-REALTIME-SYNC

## Scope
Support:
- MP4 direct URLs
- HLS `.m3u8` URLs when technically supported

If browser-native HLS support is insufficient for the target browser matrix, introduce `hls.js` behind the adapter rather than coupling it to room logic.

## Validation
- Validate URL shape.
- Reject unsupported protocols.
- Do not allow dangerous arbitrary protocols such as `javascript:`.
- Surface media/CORS failures clearly.

## Acceptance criteria
An authorized user can set a valid direct source and other participants receive the same source and playback state.
Invalid source input is rejected before changing authoritative room state.
