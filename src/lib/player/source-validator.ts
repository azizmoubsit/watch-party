import type { VideoSourceType } from "./types";

export interface SourceValidationResult {
  valid: boolean;
  type?: VideoSourceType;
  sanitizedUrl?: string;
  error?: string;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || null;
      }
      const match = parsed.pathname.match(/\/(embed|v|shorts)\/([^/?]+)/);
      if (match && match[2]) {
        return match[2];
      }
    }
  } catch {
    // Return null if invalid URL
  }
  return null;
}

export function validateVideoSource(urlInput: string): SourceValidationResult {
  const url = urlInput.trim();

  if (!url) {
    return { valid: false, error: "Media URL cannot be empty." };
  }

  // Reject dangerous pseudo-protocols
  const lower = url.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("vbscript:")
  ) {
    return {
      valid: false,
      error: "Invalid protocol. Only http:// and https:// URLs are allowed.",
    };
  }

  // Ensure valid URL structure
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: "Please enter a valid HTTP or HTTPS URL." };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      valid: false,
      error: "Only http:// and https:// media links are supported.",
    };
  }

  // Auto-detect provider type
  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();

  let detectedType: VideoSourceType = "mp4";

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    const ytId = extractYouTubeId(url);
    if (!ytId) {
      return {
        valid: false,
        error: "Unrecognized YouTube URL format. Please provide a standard watch or share link.",
      };
    }
    detectedType = "youtube";
  } else if (pathname.endsWith(".m3u8") || parsedUrl.search.includes(".m3u8")) {
    detectedType = "hls";
  } else if (
    pathname.endsWith(".mp4") ||
    pathname.endsWith(".webm") ||
    pathname.endsWith(".ogv") ||
    pathname.endsWith(".mov")
  ) {
    detectedType = "mp4";
  }

  return {
    valid: true,
    type: detectedType,
    sanitizedUrl: parsedUrl.toString(),
  };
}
