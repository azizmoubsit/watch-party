"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Tv, Users, Copy, Check, AlertTriangle, Link2, UserMinus, Settings, BarChart3, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchRoomWithMembership } from "@/lib/rooms/room-service";
import { updateMemberRoleAction, removeMemberAction } from "@/lib/rooms/role-service";
import { can } from "@/lib/permissions/permissions";
import type { Room, RoomMember, RoomRole } from "@/types/room";
import type { VideoSource } from "@/lib/player/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SkeletonVideoPlayer, SkeletonParticipantList } from "@/components/ui/skeleton";
import { VideoPlayerCanvas, type VideoPlayerHandle } from "@/components/player/video-player-canvas";
import { useRoomSync } from "@/lib/sync/use-room-sync";
import { useRoomPresence } from "@/lib/presence/use-room-presence";
import { useWatchTime } from "@/lib/telemetry/use-watch-time";
import { useRoomChat } from "@/lib/chat/use-room-chat";
import { RoomChatPanel } from "@/components/room/room-chat-panel";
import { ChangeSourceModal } from "@/components/room/change-source-modal";
import { RoomSettingsModal } from "@/components/room/room-settings-modal";
import { RoomAnalyticsModal } from "@/components/room/room-analytics-modal";

import { calculateExpectedPosition } from "@/lib/sync/sync-engine";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { user, displayName: authDisplayName, isLoading: isAuthLoading } = useAuth();

  const [room, setRoom] = React.useState<Room | null>(null);
  const [currentMember, setCurrentMember] = React.useState<RoomMember | null>(null);
  const [members, setMembers] = React.useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [isChangeSourceOpen, setIsChangeSourceOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = React.useState<"chat" | "members">("chat");

  const playerRef = React.useRef<VideoPlayerHandle>(null);
  const hasInitializedPlayerRef = React.useRef(false);

  const userRole = currentMember?.role || (room?.owner_id === user?.id ? "owner" : "viewer");

  const { formattedWatchTime } = useWatchTime({
    roomId,
    userId: user?.id,
  });

  const { isUserOnline, onlineCount } = useRoomPresence({
    roomId,
    userId: user?.id,
    displayName: authDisplayName || "Anonymous User",
    role: userRole,
  });

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendMessage,
  } = useRoomChat({
    roomId,
    userId: user?.id,
    displayName: authDisplayName || "Anonymous User",
    role: userRole,
  });

  const canControl = can(userRole, "play");
  const canSeek = can(userRole, "seek", { allowControllerSeek: room?.allow_controller_seek });
  const canChangeSource = can(userRole, "change_source");
  const canManageRoles = can(userRole, "manage_roles");
  const canManageSettings = can(userRole, "manage_settings");

  const reloadRoomData = React.useCallback(async () => {
    if (!roomId) return;
    const result = await fetchRoomWithMembership(roomId);
    if (result.room) {
      setRoom(result.room);
      setCurrentMember(result.member);
      setMembers(result.members);
    }
  }, [roomId]);

  const {
    isConnected,
    broadcastUserPlay,
    broadcastUserPause,
    broadcastUserSeek,
    broadcastRoleUpdate,
  } = useRoomSync({
    room,
    userId: user?.id,
    canControl,
    onApplyPlay: async () => {
      if (playerRef.current) await playerRef.current.applyPlay();
    },
    onApplyPause: async () => {
      if (playerRef.current) await playerRef.current.applyPause();
    },
    onApplySeek: async (pos) => {
      if (playerRef.current) await playerRef.current.applySeek(pos);
    },
    onRoomStateUpdated: (updatedRoom) => {
      setRoom(updatedRoom);
    },
    onRoleUpdated: async () => {
      await reloadRoomData();
    },
  });

  // Prompt before reload or close tab when user is inside room
  React.useEffect(() => {
    if (!roomId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId]);

  // Restore calculated expected position & status on reload/join
  React.useEffect(() => {
    if (!room || hasInitializedPlayerRef.current) return;

    const expectedPos = calculateExpectedPosition({
      status: room.playback_status || "paused",
      position: room.playback_position || 0,
      changedAt: room.changed_at || room.updated_at || new Date().toISOString(),
    });

    const timer = setTimeout(async () => {
      if (playerRef.current) {
        hasInitializedPlayerRef.current = true;
        await playerRef.current.applySeek(expectedPos);
        if (room.playback_status === "playing") {
          await playerRef.current.applyPlay();
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [room]);

  React.useEffect(() => {
    let mounted = true;

    async function loadRoom() {
      if (!roomId || isAuthLoading) return;

      setIsLoading(true);
      setError(null);

      const result = await fetchRoomWithMembership(roomId);

      if (!mounted) return;

      if (result.error || !result.room) {
        setError(result.error || "Room not found.");
        setIsLoading(false);
        return;
      }

      setRoom(result.room);
      setCurrentMember(result.member);
      setMembers(result.members);
      setIsLoading(false);
    }

    loadRoom();

    return () => {
      mounted = false;
    };
  }, [roomId, isAuthLoading, user]);

  const copyRoomCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRoleChange = async (targetUserId: string, newRole: RoomRole) => {
    if (!room) return;
    const res = await updateMemberRoleAction({ roomId: room.id, targetUserId, newRole });
    if (res.success) {
      broadcastRoleUpdate(targetUserId, newRole);
      await reloadRoomData();
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!room) return;
    const res = await removeMemberAction({ roomId: room.id, targetUserId });
    if (res.success) {
      await reloadRoomData();
    }
  };

  const videoSource: VideoSource | null = React.useMemo(() => {
    return room?.source_url
      ? { url: room.source_url, type: room.source_type }
      : null;
  }, [room?.source_url, room?.source_type]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-800 animate-pulse rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-800 animate-pulse rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <SkeletonVideoPlayer />
          </div>
          <div className="lg:col-span-1">
            <SkeletonParticipantList />
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Room Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || "The watch room you are trying to access does not exist or may have been deleted."}
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="primary">
          Return to Watch Party Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Room Header Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Tv className="w-6 h-6 text-indigo-400" />
              {room.title}
            </h1>
            <Badge variant={userRole === "owner" ? "primary" : userRole === "controller" ? "warning" : "slate"}>
              Role: {userRole}
            </Badge>
            <Badge variant={isConnected ? "success" : "warning"}>
              {isConnected ? "Realtime Connected" : "Connecting..."}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Created by <strong className="text-slate-200">{currentMember?.display_name || authDisplayName || "Room Host"}</strong></span>
          </p>
        </div>

        {/* Room Code & Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canManageSettings && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BarChart3 className="w-3.5 h-3.5 text-indigo-400" />}
                onClick={() => setIsAnalyticsOpen(true)}
              >
                Analytics
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="w-3.5 h-3.5 text-indigo-400" />}
                onClick={() => setIsSettingsOpen(true)}
              >
                Settings
              </Button>
            </>
          )}

          {canChangeSource && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Link2 className="w-3.5 h-3.5 text-indigo-400" />}
              onClick={() => setIsChangeSourceOpen(true)}
            >
              Change Source
            </Button>
          )}

          <button
            onClick={copyRoomCode}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-medium text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            title="Click to copy room code"
          >
            <span>Code: <strong className="text-indigo-400">{room.code}</strong></span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/")}
          >
            Leave Room
          </Button>
        </div>
      </div>

      {/* Main Grid: Video Player + Chat / Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Player Canvas & Controls */}
        <div className="lg:col-span-3 space-y-4">
          <VideoPlayerCanvas
            ref={playerRef}
            source={videoSource}
            canControl={canControl}
            onUserPlay={() => {
              const currentTime = playerRef.current?.getCurrentTime() || 0;
              broadcastUserPlay(currentTime);
            }}
            onUserPause={() => {
              const currentTime = playerRef.current?.getCurrentTime() || 0;
              broadcastUserPause(currentTime);
            }}
            onUserSeek={(pos) => {
              if (canSeek) {
                broadcastUserSeek(pos);
              }
            }}
          />

          {!canControl && (
            <Alert variant="info">
              You are currently a <strong>Viewer</strong> in this room. Playback synchronization is managed by the Room Owner and Controllers.
            </Alert>
          )}
        </div>

        {/* Right Column: Tabbed Chat / Participant Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          {/* Tab Navigation Header */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveSidebarTab("chat")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeSidebarTab === "chat"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Live Chat
            </button>
            <button
              onClick={() => setActiveSidebarTab("members")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeSidebarTab === "members"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Members ({onlineCount || 1})
            </button>
          </div>

          {/* Tab Content */}
          {activeSidebarTab === "chat" ? (
            <RoomChatPanel
              messages={messages}
              isLoading={isChatLoading}
              error={chatError}
              currentUserId={user?.id}
              onSendMessage={sendMessage}
            />
          ) : (
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Participants
                </h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {onlineCount || 1} online
                </span>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {members.length > 0 ? (
                  members.map((m) => {
                    const online = isUserOnline(m.user_id) || m.user_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs shrink-0">
                                {m.display_name.charAt(0).toUpperCase() || "U"}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                                  online ? "bg-emerald-400" : "bg-slate-600"
                                }`}
                                title={online ? "Online" : "Offline"}
                              />
                            </div>
                            <div className="truncate">
                              <p className="font-medium text-slate-200 truncate">{m.display_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                {m.user_id === user?.id ? `(You) • ${formattedWatchTime}` : online ? "Online" : "Offline"}
                              </p>
                            </div>
                          </div>

                          <Badge variant={m.role === "owner" ? "primary" : m.role === "controller" ? "warning" : "slate"}>
                            {m.role}
                          </Badge>
                        </div>

                        {/* Owner Role Management Controls */}
                        {canManageRoles && m.user_id !== user?.id && m.role !== "owner" && (
                          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.user_id, e.target.value as RoomRole)}
                              className="bg-slate-950 text-slate-300 text-[11px] rounded-lg px-2 py-1 border border-slate-800 focus:outline-none"
                            >
                              <option value="controller">Set Controller</option>
                              <option value="viewer">Set Viewer</option>
                            </select>

                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1 text-[11px] transition-colors"
                              title="Remove member from room"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs">
                        {(authDisplayName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{authDisplayName || "You"}</p>
                        <p className="text-[10px] text-slate-500 font-mono">(Active Host)</p>
                      </div>
                    </div>
                    <Badge variant={userRole === "owner" ? "primary" : "slate"}>{userRole}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Source Modal */}
      {room && (
        <ChangeSourceModal
          isOpen={isChangeSourceOpen}
          onClose={() => setIsChangeSourceOpen(false)}
          roomId={room.id}
          currentSourceUrl={room.source_url}
          currentSourceType={room.source_type}
          onSourceChanged={reloadRoomData}
        />
      )}

      {/* Room Settings Modal */}
      {room && (
        <RoomSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          room={room}
          onSettingsUpdated={(updatedRoom) => {
            setRoom(updatedRoom);
          }}
        />
      )}

      {/* Room Analytics Modal */}
      {room && (
        <RoomAnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          roomId={room.id}
        />
      )}
    </div>
  );
}
