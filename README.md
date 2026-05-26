# linkedin

LinkedIn comment / reply generator. Same prompts and tones in two shapes:

- a local **CLI** (`linkedin comment` / `linkedin reply`) you wire to a macOS Shortcut for one-keystroke generation from your Mac
- a **FastAPI HTTP service** you run on a server, callable from iPhone Shortcuts (or anywhere) via `POST /comment` / `POST /reply` with a bearer token

Both share the same generation logic ([linkedin/prompts.py](linkedin/prompts.py), [linkedin/generate.py](linkedin/generate.py), [linkedin/posts.py](linkedin/posts.py)) and read your past posts from `posts/`.

## Local CLI

```
linkedin comment [--tone TONE]
linkedin reply   [--tone TONE] [--post N | --title TEXT]
```

The CLI reads input from **stdin** and writes the generated text to **stdout**. macOS Shortcuts handles clipboard I/O at both ends — see [shortcuts/README.md](shortcuts/README.md).

- **`linkedin comment`** — stdin = LinkedIn post; stdout = generated comment.
- **`linkedin reply`** — stdin = incoming comment on YOUR post; stdout = author-voice reply. Pulls a post from `posts/` (latest by default; `--post 3` or `--title onboarding` to pick a specific one; flags are mutually exclusive).

Default tone is `casual`. Other tones: `professional`, `encouraging`, `thoughtprovoking`.

### Install (CLI)

Requires Python 3.10+ and [`uv`](https://docs.astral.sh/uv/).

```bash
brew install uv
uv tool install --editable .
cp .env.example .env
# edit .env and paste ANTHROPIC_API_KEY
```

The `--editable` flag is important — the CLI resolves `posts/` and `.env` relative to its package location, so it needs to point back at this repo. If you move the repo, run `uv tool install --reinstall --editable .` from the new location.

### Try it

```bash
echo "We just hit 100 customers..." | linkedin comment
```

## HTTP service

Run as a FastAPI app. Used by iPhone Shortcuts and any other HTTP client. Same generation logic, bearer-token-auth, JSON request/response.

```
POST /comment   { "post": "...", "tone": "casual" }              → { "text": "...", "chars": N }
POST /reply     { "comment": "...", "tone": "...", "post_number": N | "post_title": "..." }
                                                                 → { "text": "...", "chars": N, "post_used": "NNN-slug" }
GET  /healthz                                                     → { "ok": true }    (no auth)
```

Every protected request needs `Authorization: Bearer <LINKEDIN_API_TOKEN>`.

### Local dev (without Docker)

```bash
# After `uv tool install --editable .` and a populated .env (with LINKEDIN_API_TOKEN):
linkedin-server          # binds 127.0.0.1:8081
# or
uv run python -m linkedin.server
```

### Production (Docker + Tailscale Funnel)

See [deploy/README.md](deploy/README.md) for the full VM setup. Currently live at **`https://tg-mcp.tail73224f.ts.net:8443`** on the `outbound` VM, exposed via Tailscale Funnel.

## Posts folder

`posts/` lives next to this README. Add one file per LinkedIn post you've written, named `<number>-<slug>.txt`:

```
posts/
├── 001-how-i-shipped-x.txt
├── 002-three-lessons-from-q1.txt
└── 003-why-async-meetings-work.txt
```

File contents are **LinkedIn-verbatim** — exactly what you posted, including Unicode bold characters (`𝗴𝗿𝗼𝘄𝘁𝗵`) and line breaks. No Markdown, no frontmatter.

The CLI and the server both **read** from `posts/`. Neither writes to it; you manage posts by hand (or, later, via the writer flow + remote routine).

`reply` defaults to the highest-numbered post. With no posts present, `reply` errors clearly. `comment` doesn't touch `posts/` at all.

## Configuration

`.env` in the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
LINKEDIN_API_TOKEN=<openssl rand -hex 32>     # only needed for the server
```

The CLI loads `.env` from the repo root regardless of cwd; the server reads its env from Docker's `env_file: [.env]`.

## Errors

CLI exits non-zero with a stderr message on:
- empty stdin
- missing `ANTHROPIC_API_KEY`
- `linkedin reply` with empty `posts/`
- `--post N` / `--title TEXT` no match / ambiguous title
- Anthropic API failures

Server returns JSON error bodies with a machine-readable `code`:
- `401 unauthorized`, `400 bad_request`, `404 post_not_found`, `409 ambiguous_title`, `503 posts_empty`, `502 upstream_error`

## Branch

`scripted` is an orphan branch — no shared history with `master`. `master` still holds the previous Next.js / Telegram Mini App version of this project, kept as a record.
