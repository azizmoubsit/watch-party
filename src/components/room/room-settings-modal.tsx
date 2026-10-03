"use client";

import * as React from "react";
import { Settings, Shield, SlidersHorizontal, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { updateRoomSettingsSchema, type Room } from "@/types/room";
import { updateRoomSettingsAction } from "@/lib/rooms/room-service";

export interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onSettingsUpdated: (updatedRoom: Room) => void;
}

export function RoomSettingsModal({
  isOpen,
  onClose,
  room,
  onSettingsUpdated,
}: RoomSettingsModalProps) {
  const [title, setTitle] = React.useState(room.title);
  const [defaultRole, setDefaultRole] = React.useState<"controller" | "viewer">(
    room.default_role || "viewer"
  );
  const [allowControllerSeek, setAllowControllerSeek] = React.useState<boolean>(
    room.allow_controller_seek ?? true
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTitle(room.title);
    setDefaultRole(room.default_role || "viewer");
    setAllowControllerSeek(room.allow_controller_seek ?? true);
    setError(null);
  }, [room, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = updateRoomSettingsSchema.safeParse({
      title,
      defaultRole,
      allowControllerSeek,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid settings.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateRoomSettingsAction({
        roomId: room.id,
        title: validation.data.title,
        defaultRole: validation.data.defaultRole,
        allowControllerSeek: validation.data.allowControllerSeek,
      });

      if (!result.success || !result.room) {
        setError(result.error || "Failed to update room settings.");
        return;
      }

      onSettingsUpdated(result.room);
      onClose();
    } catch {
      setError("An unexpected error occurred while saving settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Room Settings">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Room Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            Room Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Movie Night"
            disabled={isLoading}
            maxLength={50}
          />
        </div>

        {/* Default Role for New Members */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Default Role for New Members
          </label>
          <Select
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value as "controller" | "viewer")}
            disabled={isLoading}
            options={[
              { value: "viewer", label: "Viewer (Read-only playback & presence)" },
              { value: "controller", label: "Controller (Can play, pause & update source)" },
            ]}
          />
          <p className="text-[11px] text-slate-400">
            Controls what role newly joined users automatically receive when entering the room.
          </p>
        </div>

        {/* Allow Controllers to Seek */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Allow Controllers to Seek Timeline
            </div>
            <p className="text-[11px] text-slate-400">
              When enabled, controllers can seek video positions. When disabled, only room owner can seek.
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowControllerSeek}
            onChange={(e) => setAllowControllerSeek(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
