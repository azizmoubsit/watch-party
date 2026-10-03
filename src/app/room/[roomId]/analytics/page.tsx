"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Clock, Users, Tv, ShieldCheck, Activity, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RoomAnalytics } from "@/lib/telemetry/analytics-types";
import { fetchRoomAnalyticsAction } from "@/lib/telemetry/analytics-service";

export default function RoomAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

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
    loadAnalytics();
  }, [loadAnalytics]);

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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 space-y-6 text-center">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
        <p className="text-sm font-mono text-slate-400">Loading owner telemetry analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-400">
            {error || "Analytics are only accessible to the designated room owner."}
          </p>
        </div>
        <Button onClick={() => router.push(`/room/${roomId}`)} variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Watch Room
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/room/${roomId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              {analytics.title} Analytics
            </h1>
            <Badge variant="primary">Owner Portal</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Room Code: {analytics.code} • Created {formatDate(analytics.createdAt)}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAnalytics} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Metrics
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/30 bg-indigo-950/20 space-y-2">
          <p className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Total Watch Time
          </p>
          <p className="text-2xl font-black text-white font-mono">
            {formatDuration(analytics.totalWatchTimeSeconds)}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Unique Members
          </p>
          <p className="text-2xl font-black text-white font-mono">
            {analytics.totalParticipants}{" "}
            <span className="text-xs text-emerald-400 font-normal">({analytics.currentOnlineCount} online)</span>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Avg Session Time
          </p>
          <p className="text-2xl font-black text-white font-mono">
            {formatDuration(analytics.avgSessionDurationSeconds)}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <Tv className="w-4 h-4 text-indigo-400" /> Total Sessions
          </p>
          <p className="text-2xl font-black text-white font-mono">
            {analytics.totalSessions}
          </p>
        </div>
      </div>

      {/* Per-User Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" /> Member Telemetry Breakdown
        </h3>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Participant</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Total Watch Time</th>
                <th className="p-3.5">Sessions</th>
                <th className="p-3.5">First Joined</th>
                <th className="p-3.5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {analytics.userSummaries.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-medium text-white flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    {u.displayName}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={u.role === "owner" ? "primary" : u.role === "controller" ? "warning" : "slate"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-indigo-300 font-bold">
                    {formatDuration(u.totalWatchTimeSeconds)}
                  </td>
                  <td className="p-3.5 font-mono">{u.sessionCount}</td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                    {formatDate(u.lastSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
