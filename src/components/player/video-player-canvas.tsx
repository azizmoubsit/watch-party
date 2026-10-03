"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { VideoSource, PlayerState, PlayerCallbacks, VideoController } from "@/lib/player/types";
import { createPlayerController } from "@/lib/player/player-factory";
import { Badge } from "@/components/ui/badge";

export interface VideoPlayerCanvasProps {
  source: VideoSource | null;
  canControl: boolean;
  onUserPlay?: () => void;
  onUserPause?: () => void;
  onUserSeek?: (position: number) => void;
}

export interface VideoPlayerHandle {
  applyPlay: () => Promise<void>;
  applyPause: () => Promise<void>;
  applySeek: (positionSeconds: number) => Promise<void>;
  getCurrentTime: () => number;
}

export const VideoPlayerCanvas = React.forwardRef<VideoPlayerHandle, VideoPlayerCanvasProps>(
  (
    { source, canControl, onUserPlay, onUserPause, onUserSeek },
    ref
  ) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const controllerRef = React.useRef<VideoController | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [playerState, setPlayerState] = React.useState<PlayerState>({
      status: "idle",
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      error: null,
    });

    const [isAutoplayBlocked, setIsAutoplayBlocked] = React.useState(false);

    React.useImperativeHandle(
      ref,
      () => ({
        applyPlay: async () => {
          if (controllerRef.current) {
            await controllerRef.current.play("programmatic");
          }
        },
        applyPause: async () => {
          if (controllerRef.current) {
            await controllerRef.current.pause("programmatic");
          }
        },
        applySeek: async (positionSeconds: number) => {
          if (controllerRef.current) {
            await controllerRef.current.seek(positionSeconds, "programmatic");
          }
        },
        getCurrentTime: () => {
          return controllerRef.current?.getCurrentTime() || 0;
        },
      }),
      []
    );

    // Initialize player controller
    React.useEffect(() => {
      if (!videoRef.current) return;

      const callbacks: PlayerCallbacks = {
        onPlay: (origin) => {
          setIsAutoplayBlocked(false);
          if (origin === "user" && onUserPlay) {
            onUserPlay();
          }
        },
        onPause: (origin) => {
          if (origin === "user" && onUserPause) {
            onUserPause();
          }
        },
        onSeek: (position, origin) => {
          if (origin === "user" && onUserSeek) {
            onUserSeek(position);
          }
        },
        onStateChange: (state) => {
          setPlayerState(state);
        },
        onAutoplayBlocked: () => {
          setIsAutoplayBlocked(true);
        },
      };

      const controller = createPlayerController(
        videoRef.current,
        source?.type || "mp4",
        callbacks
      );
      controllerRef.current = controller;

      return () => {
        controller.destroy();
        controllerRef.current = null;
      };
    }, [onUserPlay, onUserPause, onUserSeek, source?.type]);

    // Load new source
    React.useEffect(() => {
      if (source && controllerRef.current) {
        controllerRef.current.load(source);
      }
    }, [source]);

    const handleTogglePlay = () => {
      if (!controllerRef.current || !canControl) return;

      if (playerState.status === "playing") {
        controllerRef.current.pause("user");
      } else {
        controllerRef.current.play("user");
      }
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!controllerRef.current || !canControl) return;
      const targetSeconds = parseFloat(e.target.value);
      controllerRef.current.seek(targetSeconds, "user");
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!controllerRef.current) return;
      const newVol = parseFloat(e.target.value);
      controllerRef.current.setVolume(newVol);
    };

    const handleToggleMute = () => {
      if (!controllerRef.current) return;
      controllerRef.current.setMuted(!playerState.isMuted);
    };

    const handleToggleFullscreen = () => {
      if (!containerRef.current) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    };

    const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div
        ref={containerRef}
        className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center group shadow-2xl"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Autoplay Blocked Banner Overlay */}
        {isAutoplayBlocked && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Play className="w-6 h-6 fill-indigo-400 ml-1" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Autoplay Requires Interaction</h4>
              <p className="text-xs text-slate-400">Click below to join audio stream and start playback.</p>
            </div>
            <button
              onClick={handleTogglePlay}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Enable Playback
            </button>
          </div>
        )}

        {/* Empty Source State */}
        {!source?.url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Play className="w-8 h-8 fill-indigo-400 ml-1" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">No Media Source Loaded</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Load a valid video URL to start synchronized streaming.
              </p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {playerState.status === "error" && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
            <p className="text-sm font-semibold text-white">Playback Error</p>
            <p className="text-xs text-rose-300 max-w-sm">{playerState.error}</p>
          </div>
        )}

        {/* Control Overlay Bar */}
        {source?.url && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 opacity-100 transition-opacity flex flex-col gap-2">
            {/* Timeline Scrubber */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={playerState.duration || 100}
                value={playerState.currentTime}
                onChange={handleSeekChange}
                disabled={!canControl}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  disabled={!canControl}
                  onClick={handleTogglePlay}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30"
                >
                  {playerState.status === "playing" ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <span className="font-mono text-xs">
                  {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
                </span>

                {playerState.status === "buffering" && (
                  <Badge variant="warning">Buffering...</Badge>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Volume Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleMute}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {playerState.isMuted || playerState.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={playerState.isMuted ? 0 : playerState.volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={handleToggleFullscreen}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  aria-label="Toggle Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayerCanvas.displayName = "VideoPlayerCanvas";
