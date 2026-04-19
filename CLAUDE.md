# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm prisma db seed   # Seed the database (prisma/seed.ts)
pnpm sync:gcs     # Sync GCS catalog (audio + covers) into Artist/Album/Song (scripts/sync-gcs.ts)
```

Docker (local development with PostgreSQL):
```bash
docker compose up -d   # Start PostgreSQL at port 5422 and app at port 3003
```

## Architecture

Zound is a Spotify-like music streaming app built on Next.js App Router with TypeScript.

**Key layers:**
- `app/` — Next.js App Router pages and API routes
- `app/actions/auth.ts` — Server actions for login/register/logout
- `app/api/` — REST endpoints: `/stream` (audio), `/image` (GCS proxy), `/playlists` (CRUD), `/recommendations` (OpenAI)
- `components/` — React components; `LayoutWrapper` switches between `Sidebar` (desktop) and `MobileTabBar` (mobile)
- `lib/db.ts` — Prisma singleton (PrismaPg adapter); `lib/session.ts` — JWT sessions via `jose`
- `store/usePlayerStore.ts` — Zustand store for player state (current song, queue, playback)
- `prisma/schema.prisma` — Data models: User, Artist, Album, Song, Playlist, PlaylistSong (join), Like (join)
- `proxy.ts` — Next.js middleware; protects `/`, `/library`, `/search` by checking the `zound_session` JWT cookie

**Auth flow:** bcrypt password hashing → JWT stored as `zound_session` HttpOnly cookie → middleware validates on protected routes.

**AI recommendations:** `/api/recommendations` fetches user's top 10 liked songs, sends them with the full catalog to OpenAI `gpt-4o-mini`, returns 5 suggestions. Falls back to random selection on failure.

**Media storage:** Audio and cover images live in Google Cloud Storage (`zound-media-bucket`). The service account key is base64-encoded in `GOOGLE_KEY` env var. `/api/image?path=...` proxies GCS image reads.

**TypeScript path alias:** `@/*` maps to the project root.
