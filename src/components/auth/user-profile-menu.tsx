"use client";

import * as React from "react";
import { User, Edit2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function UserProfileMenu() {
  const { user, displayName, isLoading, updateDisplayName } = useAuth();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (displayName) {
      setName(displayName);
    }
  }, [displayName]);

  if (isLoading) {
    return (
      <div className="w-24 h-8 rounded-xl bg-slate-800/60 animate-pulse border border-slate-700/50"></div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateDisplayName(name);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to update display name.");
      return;
    }

    setIsEditOpen(false);
  };

  const formattedId = user.id.slice(0, 8);

  return (
    <>
      <button
        onClick={() => setIsEditOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Click to edit display name"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
          <User className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col text-left">
          <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-[140px]">
            {displayName || "Anonymous User"}
          </span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> ID: {formattedId}
          </span>
        </div>

        <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </button>

      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User Profile"
        description="Update your display name visible to other room participants."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-indigo-400" />}
            helperText="2-30 characters."
            required
          />

          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <p><span className="text-slate-500">Supabase User ID:</span> {user.id}</p>
            <p><span className="text-slate-500">Identity Type:</span> Anonymous Session</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
