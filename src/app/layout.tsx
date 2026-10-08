import type { Metadata } from "next";
import Link from "next/link";
import { Tv } from "lucide-react";
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
                  </span>
                </div>
              </Link>

              <nav className="flex items-center gap-4 sm:gap-6">
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
              <p className="text-slate-400">
                Created by{" "}
                <a
                  href="https://azizmoubsit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold underline underline-offset-4"
                >
                  Aziz Moubsit
                </a>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
