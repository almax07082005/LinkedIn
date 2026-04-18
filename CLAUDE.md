# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude
- `TELEGRAM_BOT_TOKEN` — Used for HMAC-SHA256 validation of Telegram initData
- `ALLOWED_USERS` — Comma-separated Telegram user IDs permitted to use the app

## Architecture

**Next.js 14 App Router** project with a single client component and one API route.

### Request Flow

1. `components/CommentGenerator.tsx` (client) — user inputs a LinkedIn post and selects a tone, then POSTs to `/api/generate` with `initData` header (Telegram auth token)
2. `app/api/generate/route.ts` (server) — validates Telegram `initData` via HMAC-SHA256 (`lib/telegram-auth.ts`), checks user whitelist, builds a tone-specific system prompt, then streams `claude-sonnet-4-6` responses back as plain text
3. The client reads the stream chunk-by-chunk, updating state in real-time, and auto-copies the final result to clipboard

### Key Design Points

- **Streaming**: The API route returns a `ReadableStream` (plain text, not JSON) consumed by `fetch()` + `ReadableStream` on the client
- **Telegram Mini App**: `app/layout.tsx` injects the Telegram Web App script; the client sends `initData` on every request; the server enforces a whitelist via `ALLOWED_USERS`
- **No global state**: All UI state lives in `CommentGenerator.tsx` local React state
- **Model**: `claude-sonnet-4-6`, max 120 tokens per comment
