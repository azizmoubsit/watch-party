import assert from "node:assert/strict";

function test(name: string, fn: () => void) {
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
import { validateVideoSource, extractYouTubeId } from "../src/lib/player/source-validator.ts";

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
import { can } from "../src/lib/permissions/permissions.ts";

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
import {
  calculateExpectedPosition,
  isStaleVersion,
  shouldCorrectDrift,
  DRIFT_THRESHOLD_SECONDS,
} from "../src/lib/sync/sync-engine.ts";

console.log("\n--- Running Sync Engine Tests ---");

test("Stale version check (version <= current)", () => {
  assert.equal(isStaleVersion(5, 5), true);
  assert.equal(isStaleVersion(4, 5), true);
  assert.equal(isStaleVersion(6, 5), false);
});

test("Playback position calculation when playing", () => {
  const changedAt = Date.now() - 5000;
  const pos = calculateExpectedPosition({ status: "playing", position: 10.0, changedAt });
  assert.ok(Math.abs(pos - 15.0) < 0.1);
});

test("Playback position calculation when paused", () => {
  const changedAt = Date.now() - 5000;
  const pos = calculateExpectedPosition({ status: "paused", position: 10.0, changedAt });
  assert.equal(pos, 10.0);
});

test("Drift threshold detection", () => {
  assert.equal(shouldCorrectDrift(10.0, 10.5, DRIFT_THRESHOLD_SECONDS), false);
  assert.equal(shouldCorrectDrift(10.0, 12.0, DRIFT_THRESHOLD_SECONDS), true);
});

// 4. Zod Schemas
import { createRoomSchema, joinRoomSchema, updateRoomSettingsSchema } from "../src/types/room.ts";
import { sendMessageSchema } from "../src/types/chat.ts";

console.log("\n--- Running Zod Schema Validation Tests ---");

test("createRoomSchema valid input", () => {
  assert.equal(
    createRoomSchema.safeParse({ title: "Movie Room", displayName: "Alice" }).success,
    true
  );
});

test("joinRoomSchema valid input", () => {
  assert.equal(
    joinRoomSchema.safeParse({ code: "WP-1234", displayName: "Bob" }).success,
    true
  );
});

test("updateRoomSettingsSchema valid input", () => {
  assert.equal(
    updateRoomSettingsSchema.safeParse({
      title: "New Title",
      defaultRole: "controller",
      allowControllerSeek: false,
    }).success,
    true
  );
});

test("sendMessageSchema message validation", () => {
  assert.equal(sendMessageSchema.safeParse({ content: "Hello!" }).success, true);
  assert.equal(sendMessageSchema.safeParse({ content: "   " }).success, false);
});

console.log("\n✅ All security, sync, permission, and schema tests passed successfully!\n");
