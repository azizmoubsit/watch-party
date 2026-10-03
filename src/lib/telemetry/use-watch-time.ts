"use client";

import * as React from "react";
import {
  startWatchSessionAction,
  heartbeatWatchSessionAction,
  endWatchSessionAction,
} from "./session-service";

export interface UseWatchTimeProps {
  roomId: string | undefined;
  userId: string | undefined;
}

export function useWatchTime({ roomId, userId }: UseWatchTimeProps) {
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [accumulatedWatchSeconds, setAccumulatedWatchSeconds] = React.useState(0);

  const sessionIdRef = React.useRef<string | null>(null);
  const lastActiveTimestampRef = React.useRef<number>(Date.now());
  const pendingSecondsRef = React.useRef<number>(0);
  const isVisibleRef = React.useRef<boolean>(true);

  // Keep sessionIdRef updated
  React.useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Start watch session on mount / room join
  React.useEffect(() => {
    if (!roomId || !userId) return;

    let active = true;

    async function initSession() {
      const res = await startWatchSessionAction(roomId!);
      if (res.sessionId && active) {
        setSessionId(res.sessionId);
        sessionIdRef.current = res.sessionId;
        lastActiveTimestampRef.current = Date.now();
      }
    }

    initSession();

    return () => {
      active = false;
    };
  }, [roomId, userId]);

  // Handle Page Visibility API state & Periodic 25s Heartbeats
  React.useEffect(() => {
    if (!roomId || !userId) return;

    const HEARTBEAT_INTERVAL_MS = 25000;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      const now = Date.now();

      if (isVisible) {
        // Resuming active tab
        isVisibleRef.current = true;
        lastActiveTimestampRef.current = now;
      } else {
        // Tab hidden / backgrounded -> compute active elapsed seconds up to this moment
        if (isVisibleRef.current) {
          const elapsedSec = Math.floor((now - lastActiveTimestampRef.current) / 1000);
          if (elapsedSec > 0) {
            pendingSecondsRef.current += elapsedSec;
            setAccumulatedWatchSeconds((prev) => prev + elapsedSec);
          }
        }
        isVisibleRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = setInterval(async () => {
      if (!sessionIdRef.current) return;

      const now = Date.now();
      let increment = pendingSecondsRef.current;
      pendingSecondsRef.current = 0;

      if (isVisibleRef.current) {
        const elapsedSec = Math.floor((now - lastActiveTimestampRef.current) / 1000);
        lastActiveTimestampRef.current = now;
        increment += elapsedSec;
      }

      if (increment > 0) {
        setAccumulatedWatchSeconds((prev) => prev + increment);
        await heartbeatWatchSessionAction({
          sessionId: sessionIdRef.current,
          incrementalSeconds: increment,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);

      // Finalize session on unmount
      if (sessionIdRef.current) {
        const now = Date.now();
        let finalIncrement = pendingSecondsRef.current;
        if (isVisibleRef.current) {
          finalIncrement += Math.floor((now - lastActiveTimestampRef.current) / 1000);
        }
        endWatchSessionAction({
          sessionId: sessionIdRef.current,
          incrementalSeconds: finalIncrement,
        });
      }
    };
  }, [roomId, userId]);

  const formatWatchTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return {
    sessionId,
    accumulatedWatchSeconds,
    formattedWatchTime: formatWatchTime(accumulatedWatchSeconds),
  };
}
