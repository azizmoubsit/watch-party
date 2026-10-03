"use client";

import * as React from "react";
import { BarChart3, Clock, Users, Tv, ShieldCheck, Activity, Calendar, RefreshCw } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import type { RoomAnalytics } from "@/lib/telemetry/analytics-types";
import { fetchRoomAnalyticsAction } from "@/lib/telemetry/analytics-service";

export interface RoomAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function RoomAnalyticsModal({
  isOpen,
  onClose,
  roomId,
}: RoomAnalyticsModalProps) {
  const [analytics, setAnalytics] = React.useState<RoomAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAnalytics = React.useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchRoomAnalyticsAction(roomId);
      if (!res.success || !res.analytics) {
        setError(res.error || "Failed to load room analytics.");
      } else {
        setAnalytics(res.analytics);
      }
    } catch {
      setError("An unexpected error occurred while fetching analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  React.useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, loadAnalytics]);

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Room Telemetry & Analytics">
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Gathering telemetry metrics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Header info bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-indigo-400" /> {analytics.title}
                </h4>
                <p className="text-xs text-slate-400 font-mono">Code: {analytics.code}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={loadAnalytics} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Refresh
              </Button>
            </div>

            {/* Top Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                <p className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Total Watch Time
                </p>
                <p className="text-lg font-extrabold text-white font-mono">
                  {formatDuration(analytics.totalWatchTimeSeconds)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Total Members
                </p>
                <p className="text-lg font-extrabold text-white font-mono">
                  {analytics.totalParticipants} <span className="text-xs text-emerald-400 font-normal">({analytics.currentOnlineCount} online)</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Avg Session
                </p>
                <p className="text-lg font-extrabold text-white font-mono">
                  {formatDuration(analytics.avgSessionDurationSeconds)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Total Sessions
                </p>
                <p className="text-lg font-extrabold text-white font-mono">
                  {analytics.totalSessions}
                </p>
              </div>
            </div>

            {/* Room Timeline Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-slate-400">Created: </span>
                  <span className="text-slate-200 font-mono">{formatDate(analytics.createdAt)}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400">Latest Activity: </span>
                  <span className="text-slate-200 font-mono">{formatDate(analytics.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* User Telemetry Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Member Watch Time Breakdown
              </h4>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">Participant</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Watch Time</th>
                      <th className="p-3">Sessions</th>
                      <th className="p-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {analytics.userSummaries.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          {u.displayName}
                        </td>
                        <td className="p-3">
                          <Badge variant={u.role === "owner" ? "primary" : u.role === "controller" ? "warning" : "slate"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-indigo-300 font-semibold">
                          {formatDuration(u.totalWatchTimeSeconds)}
                        </td>
                        <td className="p-3 font-mono">{u.sessionCount}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {formatDate(u.lastSeenAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close Analytics
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
