"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { updateRoomSourceAction } from "@/lib/sync/sync-service";

export interface ChangeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentSourceUrl?: string;
  currentSourceType?: "mp4" | "hls" | "youtube";
  onSourceChanged?: () => void;
}

export function ChangeSourceModal({
  isOpen,
  onClose,
  roomId,
  currentSourceUrl = "",
  currentSourceType = "mp4",
  onSourceChanged,
}: ChangeSourceModalProps) {
  const [sourceUrl, setSourceUrl] = React.useState(currentSourceUrl);
  const [sourceType, setSourceType] = React.useState<"mp4" | "hls" | "youtube">(currentSourceType);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSourceUrl(currentSourceUrl);
    setSourceType(currentSourceType);
  }, [currentSourceUrl, currentSourceType]);

  const handleAutoDetectType = (url: string) => {
    setSourceUrl(url);
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setSourceType("youtube");
    } else if (url.endsWith(".m3u8")) {
      setSourceType("hls");
    } else {
      setSourceType("mp4");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) {
      setError("Please enter a valid media URL.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await updateRoomSourceAction({
      roomId,
      sourceUrl: sourceUrl.trim(),
      sourceType,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to change video source.");
      return;
    }

    if (onSourceChanged) {
      onSourceChanged();
    }

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Change Video Source"
      description="Update the media URL for all room participants (Room Owner only)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Media URL"
          placeholder="e.g. https://commondatastorage.googleapis.com/.../video.mp4"
          value={sourceUrl}
          onChange={(e) => handleAutoDetectType(e.target.value)}
          leftIcon={<Link2 className="w-4 h-4 text-indigo-400" />}
          required
        />

        <Select
          label="Provider Type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as "mp4" | "hls" | "youtube")}
          options={[
            { label: "Direct MP4 Video", value: "mp4" },
            { label: "HLS Stream (.m3u8)", value: "hls" },
            { label: "YouTube Video", value: "youtube" },
          ]}
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Update Source
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
