"use client";

import * as React from "react";
import { Play, Tv, Shield, Zap, Video, Radio, Clock, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateRoomModal } from "@/components/landing/create-room-modal";
import { JoinRoomModal } from "@/components/landing/join-room-modal";

export default function Home() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isJoinOpen, setIsJoinOpen] = React.useState(false);

  return (
    <div className="space-y-16 py-4">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12 lg:p-16 text-center space-y-8 border border-indigo-500/20 glow-primary">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Realtime Synchronized Playback Engine</span>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Watch Videos Together with <span className="text-gradient">Zero Lag</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Create a shared room, invite friends, and stream direct media links or provider videos with sub-second playback synchronization across all devices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            variant="primary"
            leftIcon={<Play className="w-4 h-4 fill-white" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Watch Room
          </Button>

          <Button
            size="lg"
            variant="secondary"
            leftIcon={<UserPlus className="w-4 h-4 text-slate-300" />}
            onClick={() => setIsJoinOpen(true)}
          >
            Join with Code
          </Button>
        </div>

        {/* Live Mock Sync Status */}
        <div className="pt-6 border-t border-slate-800/80 max-w-xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Broadcast Engine: <strong className="text-slate-200 font-medium">Ready</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Presence: <strong className="text-slate-200 font-medium">Supabase Realtime</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Watch-Time Telemetry: <strong className="text-slate-200 font-medium">Active</strong></span>
          </div>
        </div>
      </section>

      {/* Interactive Mock Room Preview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Room Experience Preview</h2>
            <p className="text-xs text-slate-400">Role-based controls, synchronous playback transitions, and online member tracking.</p>
          </div>
          <Badge variant="slate" className="font-mono">
            Room ID: wp-demo-8492
          </Badge>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Mock Player Header */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Synchronized Player</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono text-[11px]">Source: Big Buck Bunny (Direct MP4)</span>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="success">Synchronized v42</Badge>
            </div>
          </div>

          {/* Mock Video Canvas */}
          <div className="relative aspect-video bg-slate-950 flex flex-col items-center justify-center p-8 group">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-2xl backdrop-blur-md">
              <Play className="w-8 h-8 fill-indigo-400 ml-1" />
            </div>

            <div className="mt-4 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">Synchronized Video Canvas</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Playback actions (play, pause, seek, source change) are broadcast authoritatively to all room members.
              </p>
            </div>

            {/* Mock Player Overlay Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </button>
                <span className="font-mono text-slate-300">02:14 / 10:00</span>
              </div>

              {/* Progress track */}
              <div className="flex-1 mx-4 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="w-1/4 h-full bg-indigo-500 rounded-full"></div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span>Role: Owner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Engineered for Robust Synchronization</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Designed to withstand network latency, tab switching, delayed messages, and clock drift.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3 border border-slate-800 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Authoritative State Model</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monotonically increasing version numbers eliminate playback feedback loops and handle out-of-order broadcasts.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 border border-slate-800 hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Granular Room Roles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforce explicit permissions for Owners, Controllers, and Viewers at database and RLS boundaries.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 border border-slate-800 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Pluggable Provider Adapters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified player abstraction supporting HTML5 native media, YouTube embedded player, and custom streams seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </div>
  );
}
