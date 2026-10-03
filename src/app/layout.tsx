import type { Metadata } from "next";
import Link from "next/link";
import { Tv, Users, ShieldCheck, Sparkles } from "lucide-react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { UserProfileMenu } from "@/components/auth/user-profile-menu";
import { DisplayNameModal } from "@/components/auth/display-name-modal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watch Party | Synchronized Video Streaming Experience",
  description:
    "Watch videos in real-time sync with friends. Synchronized playback, participant presence, authority position management, and multi-provider player support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 antialiased">
        <AuthProvider>
          <DisplayNameModal />

          {/* Navigation Header */}
          <header className="sticky top-0 z-50 glass-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                    Watch Party
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      v0.1
                    </span>
                  </span>
                </div>
              </Link>

              <nav className="flex items-center gap-4 sm:gap-6">
                <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Realtime Sync
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> Multi-Role
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Supabase Auth
                  </span>
                </div>

                <UserProfileMenu />
              </nav>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800/60 py-8 bg-[#05070a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>© {new Date().getFullYear()} Watch Party. Synchronized Watch Experience.</p>
              <div className="flex items-center gap-4">
                <span>Next.js 15+ App Router</span>
                <span>•</span>
                <span>Supabase Realtime</span>
                <span>•</span>
                <span>TypeScript</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
