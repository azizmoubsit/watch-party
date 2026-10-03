# Watch Party

A real-time synchronized video streaming application built with Next.js 15+ App Router, TypeScript, and Supabase.

## Features & Core Capabilities

- **Realtime Synchronized Playback**: Keep media playback tightly synchronized across room members using Supabase Realtime Broadcast and versioned room transition state.
- **Role-Based Access Control**: Granular permissions for Room Owners, Controllers, and Viewers.
- **Participant Presence**: Live online user status tracking with Supabase Realtime Presence.
- **Provider Adapter Architecture**: Pluggable player interface supporting native HTML5 media URLs and external players (e.g. YouTube).
- **Watch-Time Telemetry**: Passive periodic active viewing heartbeats.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Glassmorphism Dark Theme
- **Database & Realtime**: Supabase Postgres, Realtime Broadcast & Presence
- **Validation**: Zod runtime schemas
- **Icons**: Lucide React

## Local Development

### 1. Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Available Scripts

- `npm run dev`: Start local development server on `http://localhost:3000`
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint checks
- `npm run typecheck`: Run TypeScript compiler check without emitting files (`tsc --noEmit`)
