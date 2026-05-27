# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LinkedIn comment / reply generator with two equivalent surfaces:

- a local **CLI** (`linkedin comment` / `linkedin reply`) — stdin → stdout, designed to be wrapped by a macOS Shortcut
- a **FastAPI HTTP service** (`linkedin-server`, or via `docker compose up`) — `POST /comment` / `POST /reply` with bearer-token auth, JSON request/response

Both share the same prompts, generation logic, and `posts/` loader. The CLI exists for the Mac; the HTTP service exists for the iPhone (and any other HTTP client).

Tone is fixed to casual (friendly-colleague voice). The previous multi-tone selector was removed — `prompts.py` inlines the casual block directly and neither the CLI nor the server takes a `tone` parameter.

## Stack

- Python 3.10+, single package `linkedin/`.
- Runtime deps: `anthropic`, `fastapi`, `uvicorn[standard]`.
- CLI distributed via `uv tool install --editable .` (binary: `linkedin`).
- Server distributed via Docker (`Dockerfile` + `docker-compose.yml`); also runnable directly via `linkedin-server` for local dev.
- Deployed on the `outbound` VM (root@5.75.161.189, see `~/.ssh/config`), exposed via Tailscale Funnel.

## Architecture

```
linkedin/
├── cli.py         # argparse, subcommand dispatch, .env loading, stdin reader
├── prompts.py     # MAX_OUTPUT_CHARS=200, casual tone block, comment + reply prompt builders
├── generate.py    # Anthropic call: generate_text(system, user) -> str (no I/O)
├── posts.py       # posts/ loader: list_posts, latest_post, post_by_number, post_by_title + errors
└── server.py      # FastAPI app: /healthz, /comment, /reply, bearer auth, JSON I/O
```

`generate_text()` is the shared core. CLI calls it and prints to stdout. Server calls it and wraps the string in a JSON response. No business logic is duplicated.

## Posts

Posts live in `posts/` next to the package, named `NNN-slug.txt`. Read-only from the CLI's and server's perspective. In production, `posts/` is bind-mounted from the host into the Docker container.

Updating posts in prod: add file locally → commit → push → `ssh outbound 'cd /root/linkedin && git pull'`. No container restart needed.

## Auth (server only)

Single shared bearer token in env var `LINKEDIN_API_TOKEN`. Checked on every protected endpoint with `hmac.compare_digest` (constant-time). `/healthz` is open.

Generate a token with `openssl rand -hex 32`.

## Environment

`.env` in the repo root with:
```
ANTHROPIC_API_KEY=...
LINKEDIN_API_TOKEN=...    # only needed for the server
```

CLI loads `.env` via a hand-rolled parser at startup (relative to the package, not cwd). Server reads it via Docker's `env_file: [.env]`.

## Deployment

See [deploy/README.md](deploy/README.md). High level: `docker compose up -d --build` on the `outbound` VM (path: `/root/linkedin/`), then `tailscale funnel --https=8443 --bg 127.0.0.1:8081` to expose publicly. Currently live at **`https://tg-mcp.tail73224f.ts.net:8443`** (the VM is registered in Tailscale as `tg-mcp`; port 443 of that device is already used by telegram-mcp, so linkedin-api goes on 8443). Posts bind-mounted from host, no rebuild needed for content changes.

## Commands

```bash
# CLI
uv tool install --editable .                # install / reinstall
echo "post" | linkedin comment              # smoke
linkedin reply --help

# Server (local dev)
linkedin-server                             # binds 127.0.0.1:8081
curl http://127.0.0.1:8081/healthz

# Server (docker, local)
docker compose up -d --build
curl http://127.0.0.1:8081/healthz

# Production
ssh outbound 'cd /root/linkedin && git pull && docker compose up -d --build'
```

## Prompts (do not silently drift)

Prompt structure preserved verbatim from the original Next.js implementation:
- HARD LENGTH LIMIT (≤200 chars total, aim 140–200)
- FORMATTING RULES (no Markdown, Unicode bold OK)
- Tone-specific block (one of four)
- "no hashtags, no 'Great post!' opener" closer

Edit `prompts.py` only. `generate.py` is dumb glue.

## Branch history

The current branch (`scripted`) is an **orphan** branch — no shared history with `master`. `master` still holds the previous Next.js / Telegram Mini App version, kept as a record.
