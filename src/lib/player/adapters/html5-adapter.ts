import type {
  VideoController,
  VideoSource,
  PlayerState,
  PlayerCallbacks,
  ActionOrigin,
} from "../types";

export class HTML5VideoAdapter implements VideoController {
  private videoElement: HTMLVideoElement;
  private callbacks: PlayerCallbacks;
  private isProgrammaticChange: boolean = false;
  private currentSource: VideoSource | null = null;
  private status: PlayerState["status"] = "idle";
  private lastError: string | null = null;

  constructor(videoElement: HTMLVideoElement, callbacks: PlayerCallbacks = {}) {
    this.videoElement = videoElement;
    this.callbacks = callbacks;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const el = this.videoElement;

    el.addEventListener("play", this.handlePlay);
    el.addEventListener("pause", this.handlePause);
    el.addEventListener("seeking", this.handleSeeking);
    el.addEventListener("timeupdate", this.handleTimeUpdate);
    el.addEventListener("waiting", this.handleWaiting);
    el.addEventListener("playing", this.handlePlaying);
    el.addEventListener("error", this.handleError);
  }

  private removeEventListeners(): void {
    const el = this.videoElement;

    el.removeEventListener("play", this.handlePlay);
    el.removeEventListener("pause", this.handlePause);
    el.removeEventListener("seeking", this.handleSeeking);
    el.removeEventListener("timeupdate", this.handleTimeUpdate);
    el.removeEventListener("waiting", this.handleWaiting);
    el.removeEventListener("playing", this.handlePlaying);
    el.removeEventListener("error", this.handleError);
  }

  private handlePlay = (): void => {
    const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    const origin: ActionOrigin = (this.isProgrammaticChange || isTabHidden) ? "programmatic" : "user";
    this.status = "playing";
    this.emitStateChange();

    if (this.callbacks.onPlay) {
      this.callbacks.onPlay(origin);
    }
  };

  private handlePause = (): void => {
    const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    const origin: ActionOrigin = (this.isProgrammaticChange || isTabHidden) ? "programmatic" : "user";
    this.status = "paused";
    this.emitStateChange();

    if (this.callbacks.onPause) {
      this.callbacks.onPause(origin);
    }
  };

  private handleSeeking = (): void => {
    const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    const origin: ActionOrigin = (this.isProgrammaticChange || isTabHidden) ? "programmatic" : "user";

    if (this.callbacks.onSeek) {
      this.callbacks.onSeek(this.getCurrentTime(), origin);
    }
  };

  private handleTimeUpdate = (): void => {
    if (this.callbacks.onTimeUpdate) {
      this.callbacks.onTimeUpdate(this.getCurrentTime());
    }
  };

  private handleWaiting = (): void => {
    this.status = "buffering";
    this.emitStateChange();
  };

  private handlePlaying = (): void => {
    this.status = "playing";
    this.emitStateChange();
  };

  private handleError = (): void => {
    const mediaError = this.videoElement.error;
    const msg = mediaError
      ? `Media error code ${mediaError.code}: ${mediaError.message}`
      : "Failed to load video source.";
    this.status = "error";
    this.lastError = msg;
    this.emitStateChange();

    if (this.callbacks.onError) {
      this.callbacks.onError(msg);
    }
  };

  private emitStateChange(): void {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({
        status: this.status,
        currentTime: this.getCurrentTime(),
        duration: this.getDuration(),
        volume: this.videoElement.volume,
        isMuted: this.videoElement.muted,
        error: this.lastError,
      });
    }
  }

  public async load(source: VideoSource): Promise<void> {
    this.currentSource = source;
    this.status = "loading";
    this.lastError = null;
    this.isProgrammaticChange = true;
    this.emitStateChange();

    this.videoElement.src = source.url;
    this.videoElement.load();

    setTimeout(() => {
      this.isProgrammaticChange = false;
    }, 1000);
  }

  public async play(origin: ActionOrigin = "user"): Promise<void> {
    const previous = this.isProgrammaticChange;
    this.isProgrammaticChange = origin === "programmatic";

    try {
      await this.videoElement.play();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        console.warn("Autoplay blocked by browser policy.");
        if (this.callbacks.onAutoplayBlocked) {
          this.callbacks.onAutoplayBlocked();
        }
      } else {
        console.error("Error calling play():", err);
      }
    } finally {
      this.isProgrammaticChange = previous;
    }
  }

  public async pause(origin: ActionOrigin = "user"): Promise<void> {
    const previous = this.isProgrammaticChange;
    this.isProgrammaticChange = origin === "programmatic";

    try {
      this.videoElement.pause();
    } finally {
      this.isProgrammaticChange = previous;
    }
  }

  public async seek(positionSeconds: number, origin: ActionOrigin = "user"): Promise<void> {
    const previous = this.isProgrammaticChange;
    this.isProgrammaticChange = origin === "programmatic";

    try {
      this.videoElement.currentTime = positionSeconds;
    } finally {
      this.isProgrammaticChange = previous;
    }
  }

  public getCurrentTime(): number {
    return this.videoElement.currentTime || 0;
  }

  public getDuration(): number {
    return this.videoElement.duration || 0;
  }

  public setMuted(muted: boolean): void {
    this.videoElement.muted = muted;
    this.emitStateChange();
  }

  public setVolume(volume: number): void {
    this.videoElement.volume = Math.max(0, Math.min(1, volume));
    this.emitStateChange();
  }

  public destroy(): void {
    this.removeEventListeners();
  }
}
