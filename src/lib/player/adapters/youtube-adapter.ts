import type {
  VideoController,
  VideoSource,
  PlayerCallbacks,
  PlayerState,
  ActionOrigin,
} from "../types";
import { extractYouTubeId } from "../source-validator";

interface YouTubePlayer {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
  getPlayerState(): number;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

interface YouTubePlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    onError?: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeGlobal {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT: YouTubeGlobal;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Global script loader helper
let ytScriptPromise: Promise<void> | null = null;
const apiReadyCallbacks: Array<() => void> = [];

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (ytScriptPromise) {
    return ytScriptPromise;
  }

  ytScriptPromise = new Promise((resolve) => {
    apiReadyCallbacks.push(resolve);

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };
  });

  return ytScriptPromise;
}

export class YouTubeVideoAdapter implements VideoController {
  private videoElement: HTMLVideoElement;
  private callbacks: PlayerCallbacks;
  private containerDiv: HTMLDivElement | null = null;
  private ytPlayerDiv: HTMLDivElement | null = null;
  private ytPlayer: YouTubePlayer | null = null;

  private isProgrammaticChange = false;
  private isDestroyed = false;
  private positionTimer: NodeJS.Timeout | null = null;
  private currentVolume = 1;
  private isMutedState = false;

  constructor(videoElement: HTMLVideoElement, callbacks: PlayerCallbacks = {}) {
    this.videoElement = videoElement;
    this.callbacks = callbacks;

    // Hide original HTML5 video tag
    this.videoElement.style.display = "none";

    // Prepare wrapper container
    const parent = this.videoElement.parentElement;
    if (parent) {
      this.containerDiv = document.createElement("div");
      this.containerDiv.className = "youtube-adapter-wrapper absolute inset-0 w-full h-full";
      this.containerDiv.style.pointerEvents = "auto";

      this.ytPlayerDiv = document.createElement("div");
      this.ytPlayerDiv.className = "w-full h-full";
      this.containerDiv.appendChild(this.ytPlayerDiv);

      parent.insertBefore(this.containerDiv, this.videoElement);
    }
  }

  public async load(source: VideoSource): Promise<void> {
    const videoId = extractYouTubeId(source.url);
    if (!videoId) {
      this.callbacks.onError?.("Invalid YouTube Video ID.");
      this.emitState("error", "Invalid YouTube Video ID.");
      return;
    }

    this.emitState("loading", null);
    await loadYouTubeIframeApi();

    if (this.isDestroyed || !this.ytPlayerDiv) return;

    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === "function") {
      this.ytPlayer.loadVideoById(videoId);
      return;
    }

    // Initialize YouTube IFrame Player
    return new Promise((resolve) => {
      this.ytPlayer = new window.YT.Player(this.ytPlayerDiv!, {
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: () => {
            if (this.isDestroyed) return;
            this.startPolling();
            this.emitState("paused", null);
            resolve();
          },
          onStateChange: (event: YouTubePlayerEvent) => {
            this.handleStateChange(event.data);
          },
          onError: (event: YouTubePlayerEvent) => {
            const errorMsg = this.formatYouTubeError(event.data);
            this.callbacks.onError?.(errorMsg);
            this.emitState("error", errorMsg);
          },
        },
      });
    });
  }

  public async play(origin: ActionOrigin = "user"): Promise<void> {
    if (!this.ytPlayer || typeof this.ytPlayer.playVideo !== "function") return;

    if (origin === "programmatic") {
      this.isProgrammaticChange = true;
    }

    try {
      this.ytPlayer.playVideo();
    } catch {
      if (origin === "programmatic") {
        this.callbacks.onAutoplayBlocked?.();
      }
    }
  }

  public async pause(origin: ActionOrigin = "user"): Promise<void> {
    if (!this.ytPlayer || typeof this.ytPlayer.pauseVideo !== "function") return;

    if (origin === "programmatic") {
      this.isProgrammaticChange = true;
    }

    this.ytPlayer.pauseVideo();
  }

  public async seek(positionSeconds: number, origin: ActionOrigin = "user"): Promise<void> {
    if (!this.ytPlayer || typeof this.ytPlayer.seekTo !== "function") return;

    if (origin === "programmatic") {
      this.isProgrammaticChange = true;
    }

    this.ytPlayer.seekTo(positionSeconds, true);

    if (origin === "user") {
      this.callbacks.onSeek?.(positionSeconds, "user");
    }
  }

  public getCurrentTime(): number {
    if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === "function") {
      return this.ytPlayer.getCurrentTime() || 0;
    }
    return 0;
  }

  public getDuration(): number {
    if (this.ytPlayer && typeof this.ytPlayer.getDuration === "function") {
      return this.ytPlayer.getDuration() || 0;
    }
    return 0;
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    if (this.ytPlayer && typeof this.ytPlayer.mute === "function") {
      if (muted) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
      }
    }
    this.emitCurrentState();
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
      this.ytPlayer.setVolume(this.currentVolume * 100);
    }
    this.emitCurrentState();
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopPolling();

    if (this.ytPlayer && typeof this.ytPlayer.destroy === "function") {
      try {
        this.ytPlayer.destroy();
      } catch {
        // Ignore destroy error
      }
      this.ytPlayer = null;
    }

    if (this.containerDiv && this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
      this.containerDiv = null;
    }

    // Restore video element display
    this.videoElement.style.display = "";
  }

  private handleStateChange(stateCode: number): void {
    if (this.isDestroyed) return;

    const YTState = window.YT?.PlayerState;
    if (!YTState) return;

    switch (stateCode) {
      case YTState.PLAYING: {
        const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
        const origin: ActionOrigin = (this.isProgrammaticChange || isTabHidden) ? "programmatic" : "user";
        this.isProgrammaticChange = false;
        this.callbacks.onPlay?.(origin);
        this.emitState("playing", null);
        break;
      }
      case YTState.PAUSED: {
        const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
        const origin: ActionOrigin = (this.isProgrammaticChange || isTabHidden) ? "programmatic" : "user";
        this.isProgrammaticChange = false;
        this.callbacks.onPause?.(origin);
        this.emitState("paused", null);
        break;
      }
      case YTState.BUFFERING: {
        this.emitState("buffering", null);
        break;
      }
      case YTState.ENDED: {
        this.isProgrammaticChange = false;
        this.emitState("paused", null);
        break;
      }
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.positionTimer = setInterval(() => {
      if (this.isDestroyed) return;
      const current = this.getCurrentTime();
      this.callbacks.onTimeUpdate?.(current);
      this.emitCurrentState();
    }, 250);
  }

  private stopPolling(): void {
    if (this.positionTimer) {
      clearInterval(this.positionTimer);
      this.positionTimer = null;
    }
  }

  private emitState(status: PlayerState["status"], error: string | null = null): void {
    const state: PlayerState = {
      status,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.currentVolume,
      isMuted: this.isMutedState,
      error,
    };
    this.callbacks.onStateChange?.(state);
  }

  private emitCurrentState(): void {
    if (!this.ytPlayer) return;
    const isPlaying = this.ytPlayer.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
    const status: PlayerState["status"] = isPlaying ? "playing" : "paused";
    this.emitState(status, null);
  }

  private formatYouTubeError(code: number): string {
    switch (code) {
      case 2:
        return "Invalid YouTube video URL parameters.";
      case 5:
        return "HTML5 player error on YouTube video.";
      case 100:
        return "YouTube video not found or removed.";
      case 101:
      case 150:
        return "YouTube video owner has disabled embedded playback.";
      default:
        return "Failed to load YouTube video stream.";
    }
  }
}
