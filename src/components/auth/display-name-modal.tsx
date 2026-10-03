"use client";

import * as React from "react";
import { User, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth/auth-context";

export function DisplayNameModal() {
  const { user, displayName, isLoading, updateDisplayName } = useAuth();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // Show modal if user is authenticated but has no display_name metadata set
  const shouldShow =
    !isLoading &&
    !!user &&
    !displayName &&
    !dismissed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateDisplayName(name);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to set display name.");
      return;
    }

    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <Dialog
      isOpen={shouldShow}
      onClose={() => setDismissed(true)}
      title="Welcome to Watch Party"
      description="Choose a display name so other members in your room can identify you."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Display Name"
          placeholder="e.g. Alex"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-indigo-400" />}
          helperText="2-30 characters. You can change this anytime."
          autoFocus
          required
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-200" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
