import type { VideoController, VideoSourceType, PlayerCallbacks } from "./types";
import { HTML5VideoAdapter } from "./adapters/html5-adapter";
import { HLSVideoAdapter } from "./adapters/hls-adapter";
import { YouTubeVideoAdapter } from "./adapters/youtube-adapter";

export function createPlayerController(
  element: HTMLVideoElement,
  sourceType: VideoSourceType = "mp4",
  callbacks: PlayerCallbacks = {}
): VideoController {
  if (sourceType === "hls") {
    return new HLSVideoAdapter(element, callbacks);
  }

  if (sourceType === "youtube") {
    return new YouTubeVideoAdapter(element, callbacks);
  }

  return new HTML5VideoAdapter(element, callbacks);
}
