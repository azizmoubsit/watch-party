export type VideoSourceType = "mp4" | "hls" | "youtube";

export interface VideoSource {
  url: string;
  type: VideoSourceType;
}

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "error";

export interface PlayerState {
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error?: string | null;
}

export type ActionOrigin = "user" | "programmatic";

export interface PlayerCallbacks {
  onPlay?: (origin: ActionOrigin) => void;
  onPause?: (origin: ActionOrigin) => void;
  onSeek?: (positionSeconds: number, origin: ActionOrigin) => void;
  onTimeUpdate?: (currentTimeSeconds: number) => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: string) => void;
  onAutoplayBlocked?: () => void;
}

export interface VideoController {
  play(origin?: ActionOrigin): Promise<void>;
  pause(origin?: ActionOrigin): Promise<void>;
  seek(positionSeconds: number, origin?: ActionOrigin): Promise<void>;
  getCurrentTime(): number;
  getDuration(): number;
  load(source: VideoSource): Promise<void>;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  destroy(): void;
}
