"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, User } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/auth-context";
import { joinRoomByCodeAction } from "@/lib/rooms/room-service";
import { joinRoomSchema } from "@/types/room";

export interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const { displayName: authDisplayName, updateDisplayName } = useAuth();
  const [roomCode, setRoomCode] = React.useState("");
  const [displayName, setDisplayName] = React.useState(authDisplayName || "");
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

    const validation = joinRoomSchema.safeParse({
      code: roomCode,
      displayName,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid input.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (displayName !== authDisplayName) {
        await updateDisplayName(displayName);
      }

      const result = await joinRoomByCodeAction({
        code: roomCode,
        displayName,
      });

      if (!result.success || !result.room) {
        setError(result.error || "Failed to join room.");
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
      title="Join Watch Room"
      description="Enter a shared room code or link to join an active session."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Room Code or Join Link"
          placeholder="e.g. WP-8492"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          leftIcon={<KeyRound className="w-4 h-4 text-indigo-400" />}
          required
        />

        <Input
          label="Your Display Name"
          placeholder="e.g. Sam"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-purple-400" />}
          required
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Join Session
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
