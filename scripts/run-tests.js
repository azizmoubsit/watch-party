import assert from "node:assert/strict";

// Helper for assertions
function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Source Validator Logic
import { validateVideoSource, extractYouTubeId } from "../src/lib/player/source-validator.js";

console.log("\n--- Running Security & Source Validator Tests ---");

test("MP4 validation", () => {
  const res = validateVideoSource("https://example.com/video.mp4");
  assert.equal(res.valid, true);
  assert.equal(res.type, "mp4");
});

test("HLS validation", () => {
  const res = validateVideoSource("https://example.com/stream.m3u8");
  assert.equal(res.valid, true);
  assert.equal(res.type, "hls");
});

test("YouTube validation", () => {
  const res = validateVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(res.valid, true);
  assert.equal(res.type, "youtube");
});

test("Malicious protocol rejection (javascript:)", () => {
  const res = validateVideoSource("javascript:alert(1)");
  assert.equal(res.valid, false);
});

test("Malicious protocol rejection (data:)", () => {
  const res = validateVideoSource("data:text/html,<script>alert(1)</script>");
  assert.equal(res.valid, false);
});

test("YouTube ID extraction", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

// 2. Permissions Matrix
import { can } from "../src/lib/permissions/permissions.js";

console.log("\n--- Running Permission Matrix Tests ---");

test("Owner permissions", () => {
  assert.equal(can("owner", "play"), true);
  assert.equal(can("owner", "seek"), true);
  assert.equal(can("owner", "manage_settings"), true);
  assert.equal(can("owner", "manage_roles"), true);
});

test("Controller permissions", () => {
  assert.equal(can("controller", "play"), true);
  assert.equal(can("controller", "pause"), true);
  assert.equal(can("controller", "manage_settings"), false);
  assert.equal(can("controller", "manage_roles"), false);
});

test("Conditional controller seek setting", () => {
  assert.equal(can("controller", "seek", { allowControllerSeek: true }), true);
  assert.equal(can("controller", "seek", { allowControllerSeek: false }), false);
});

test("Viewer permissions", () => {
  assert.equal(can("viewer", "play"), false);
  assert.equal(can("viewer", "pause"), false);
  assert.equal(can("viewer", "seek"), false);
  assert.equal(can("viewer", "change_source"), false);
});

// 3. Sync Engine Monotonic Version & Drift Math
import { processRoomSyncEvent, calculateExpectedPlaybackPosition } from "../src/lib/sync/sync-engine.js";

console.log("\n--- Running Sync Engine Tests ---");

test("Stale event rejection (version <= current)", () => {
  const state = { status: "paused", position: 10.0, changedAt: 100000, version: 5 };
  const event = { type: "PLAY", roomId: "r1", userId: "u1", version: 5, position: 15.0, timestamp: 105000 };
  const res = processRoomSyncEvent(state, event, 105000);
  assert.equal(res.shouldApply, false);
});

test("Valid event acceptance (version > current)", () => {
  const state = { status: "paused", position: 10.0, changedAt: 100000, version: 5 };
  const event = { type: "PLAY", roomId: "r1", userId: "u1", version: 6, position: 15.0, timestamp: 105000 };
  const res = processRoomSyncEvent(state, event, 105000);
  assert.equal(res.shouldApply, true);
  assert.equal(res.nextState.version, 6);
  assert.equal(res.nextState.status, "playing");
});

test("Playback position calculation when playing", () => {
  const state = { status: "playing", position: 10.0, changedAt: 100000, version: 1 };
  const pos = calculateExpectedPlaybackPosition(state, 105000);
  assert.equal(pos, 15.0);
});

test("Playback position calculation when paused", () => {
  const state = { status: "paused", position: 10.0, changedAt: 100000, version: 1 };
  const pos = calculateExpectedPlaybackPosition(state, 105000);
  assert.equal(pos, 10.0);
});

console.log("\n✅ All security, sync, and permission unit tests passed successfully!\n");
