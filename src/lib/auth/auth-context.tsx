"use client";

import * as React from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { validateDisplayName } from "./profile";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  displayName: string;
  isLoading: boolean;
  error: string | null;
  updateDisplayName: (name: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = React.useState(() => createClient());
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const displayName =
    (user?.user_metadata?.display_name as string) ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "";

  // Initial session setup & listener
  React.useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: existingSession }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Error getting session:", sessionError.message);
        }

        if (existingSession && mounted) {
          setSession(existingSession);
          setUser(existingSession.user);
          setIsLoading(false);
          return;
        }

        // If no session exists, sign in anonymously
        const { data: anonData, error: anonError } =
          await supabase.auth.signInAnonymously();

        if (anonError) {
          console.error("Anonymous sign-in error:", anonError.message);
          if (mounted) {
            setError("Could not establish anonymous user session.");
            setIsLoading(false);
          }
          return;
        }

        if (mounted && anonData.session) {
          setSession(anonData.session);
          setUser(anonData.user);
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        if (mounted) {
          setError("Failed to initialize authentication.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const updateDisplayName = async (
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = validateDisplayName(name);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const sanitized = validation.value!;

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { display_name: sanitized },
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      if (data.user) {
        setUser(data.user);
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update display name";
      return { success: false, error: msg };
    }
  };

  const refreshSession = async () => {
    const { data: { session: refreshedSession } } = await supabase.auth.getSession();
    setSession(refreshedSession);
    setUser(refreshedSession?.user ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        displayName,
        isLoading,
        error,
        updateDisplayName,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
