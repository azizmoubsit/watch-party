"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tv, Link2, User } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/auth-context";
import { createRoomAction } from "@/lib/rooms/room-service";
import { createRoomSchema } from "@/types/room";
import { validateVideoSource } from "@/lib/player/source-validator";

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { displayName: authDisplayName, updateDisplayName } = useAuth();
  const [roomName, setRoomName] = React.useState("");
  const [displayName, setDisplayName] = React.useState(authDisplayName || "");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authDisplayName && !displayName) {
      setDisplayName(authDisplayName);
    }
  }, [authDisplayName, displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = createRoomSchema.safeParse({
      title: roomName,
      displayName,
      sourceUrl,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid input.");
      return;
    }

    if (sourceUrl.trim()) {
      const sourceValidation = validateVideoSource(sourceUrl);
      if (!sourceValidation.valid) {
        setError(sourceValidation.error || "Invalid video URL.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Sync display name if modified
      if (displayName !== authDisplayName) {
        await updateDisplayName(displayName);
      }

      const result = await createRoomAction({
        title: roomName,
        displayName,
        sourceUrl,
      });

      if (!result.success || !result.room) {
        setError(result.error || "Failed to create room.");
        setIsSubmitting(false);
        return;
      }

      onClose();
      router.push(`/room/${result.room.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Watch Room"
      description="Start a new room as the Room Owner and invite friends to watch together."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Room Name"
          placeholder="e.g. Friday Movie Night"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          leftIcon={<Tv className="w-4 h-4 text-indigo-400" />}
          required
        />

        <Input
          label="Your Display Name"
          placeholder="e.g. Alex"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-purple-400" />}
          required
        />

        <Input
          label="Initial Media URL (Optional)"
          placeholder="e.g. https://commondatastorage.googleapis.com/.../video.mp4"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          leftIcon={<Link2 className="w-4 h-4 text-emerald-400" />}
          helperText="Direct MP4/HLS URL or YouTube provider link."
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create & Enter Room
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
