// Maximum acceptable drift in seconds before executing programmatic seek correction
export const DRIFT_THRESHOLD_SECONDS = 1.25;

export function calculateExpectedPosition(state: {
  status: "playing" | "paused";
  position: number;
  changedAt: string | number;
}): number {
  if (state.status === "paused") {
    return state.position;
  }

  const changedAtMs =
    typeof state.changedAt === "string"
      ? new Date(state.changedAt).getTime()
      : state.changedAt;

  const nowMs = Date.now();
  const elapsedSeconds = Math.max(0, (nowMs - changedAtMs) / 1000);

  return state.position + elapsedSeconds;
}

export function isStaleVersion(incomingVersion: number, currentVersion: number): boolean {
  return incomingVersion <= currentVersion;
}

export function shouldCorrectDrift(
  currentLocalTime: number,
  expectedTime: number,
  threshold: number = DRIFT_THRESHOLD_SECONDS
): boolean {
  return Math.abs(currentLocalTime - expectedTime) > threshold;
}
