"use client";

import * as React from "react";
import { Send, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/types/chat";

export interface RoomChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string | null;
  currentUserId?: string;
  onSendMessage: (content: string) => Promise<boolean>;
}

export function RoomChatPanel({
  messages,
  isLoading,
  error,
  currentUserId,
  onSendMessage,
}: RoomChatPanelProps) {
  const [content, setContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    const textToSend = content;
    setContent("");
    setIsSending(true);

    const success = await onSendMessage(textToSend);
    if (!success) {
      setContent(textToSend); // Restore if failed
    }

    setIsSending(false);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[420px] rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" /> Room Live Chat
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Realtime</span>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-3.5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 font-semibold">No Messages Yet</p>
            <p className="text-[11px] text-slate-400 max-w-[200px]">
              Say hello to start the conversation while watching together!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.user_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1 ${
                  isSelf ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {isSelf ? "You" : m.display_name}
                  </span>
                  <Badge
                    variant={
                      m.role === "owner"
                        ? "primary"
                        : m.role === "controller"
                        ? "warning"
                        : "slate"
                    }
                  >
                    {m.role}
                  </Badge>
                  <span>•</span>
                  <span className="font-mono">{formatTime(m.created_at)}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isSelf
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-3.5 py-1.5 bg-rose-500/10 border-t border-rose-500/20 text-[11px] text-rose-300">
          {error}
        </div>
      )}

      {/* Message Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Send a chat message..."
          maxLength={500}
          disabled={isSending}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
        >
          {isSending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
