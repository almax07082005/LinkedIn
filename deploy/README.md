# Deploy to the `outbound` VM

Step-by-step guide to running the `linkedin-api` service on the outbound VM (Ubuntu 26.04, Docker 29.5.2, behind Tailscale Funnel for public HTTPS).

## Prerequisites (already in place)

- VM: `outbound` (SSH alias → `root@5.75.161.189`)
- Docker + Compose: installed and running
- Tailscale: installed (currently fronting `telegram-mcp` at `https://tg-mcp.tail73224f.ts.net`)
- Repo: pushed to GitHub (branch `scripted`)
- Tokens in hand:
  - `ANTHROPIC_API_KEY` (the existing one)
  - `LINKEDIN_API_TOKEN` — generate fresh: `openssl rand -hex 32`

## First deploy

```bash
ssh outbound

# Clone into /root/linkedin (matches the /root/<service> convention)
cd /root
git clone <repo-url> linkedin
cd linkedin
git checkout scripted

# Set up environment
cp .env.example .env
nano .env       # paste real ANTHROPIC_API_KEY and LINKEDIN_API_TOKEN

# Build and start
docker compose up -d --build

# Watch logs to confirm uvicorn comes up cleanly
docker compose logs -f --tail 50
# Expect: "Uvicorn running on http://0.0.0.0:8081"
# Ctrl-C to exit logs (container keeps running)
```

## Local smoke tests on the VM (before exposing publicly)

```bash
# Health check — no auth needed
curl -fsS http://127.0.0.1:8081/healthz
# {"ok":true}

# Unauthorized call
curl -sS -X POST http://127.0.0.1:8081/comment \
  -H "Content-Type: application/json" \
  -d '{"post":"test"}'
# 401 {"detail":{"error":"missing bearer token","code":"unauthorized"}}

# Authorized call
TOKEN=$(grep ^LINKEDIN_API_TOKEN= /root/linkedin/.env | cut -d= -f2-)
curl -sS -X POST http://127.0.0.1:8081/comment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"post":"We just hit 100 paying customers."}'
# {"text":"...","chars":N}
```

## Expose via Tailscale Funnel

The `outbound` VM is registered in Tailscale as device `tg-mcp`, and port 443 of that device already routes to `telegram-mcp` on `127.0.0.1:8000`. Tailscale Funnel supports three HTTPS ports per device: 443, 8443, 10000. We use **8443** for `linkedin-api`:

```bash
# On the VM as root:
tailscale funnel --https=8443 --bg 127.0.0.1:8081

# Confirm:
tailscale funnel status
# Expect both routes:
#   https://tg-mcp.tail73224f.ts.net       (telegram-mcp)
#   https://tg-mcp.tail73224f.ts.net:8443  (linkedin-api)
```

**Public URL: `https://tg-mcp.tail73224f.ts.net:8443`**

Verify from your Mac (not the VM):

```bash
curl -fsS https://tg-mcp.tail73224f.ts.net:8443/healthz
# {"ok":true}
```

To disable later: `tailscale funnel --https=8443 off`.

If you'd rather have a cleaner subdomain (e.g. `https://tg-mcp.tail73224f.ts.net:8443/` on port 443), register a separate Tailscale device for this service. The two-port-on-one-device setup is the simplest path and works identically from Shortcuts.

## Updating posts

```bash
# Locally: add a new post, commit, push to scripted
cd ~/Documents/Pets/LinkedIn
echo "..." > posts/004-new-post.txt
git add posts/004-new-post.txt && git commit -m "Add post 004" && git push

# On the VM: pull the new file. No container restart needed —
# posts/ is bind-mounted and posts.py reads the dir on every request.
ssh outbound 'cd /root/linkedin && git pull'
```

## Updating the code

```bash
# Locally: commit + push to scripted
git push

# On the VM: pull + rebuild
ssh outbound 'cd /root/linkedin && git pull && docker compose up -d --build'
```

## iPhone Shortcuts wiring

Create one Shortcut per action you want. Example: **LinkedIn — Comment (Casual)**:

1. **Get Clipboard** (action).
2. **Get Contents of URL** (action):
   - **URL**: `https://tg-mcp.tail73224f.ts.net:8443/comment`
   - **Method**: `POST`
   - **Headers**:
     - `Authorization`: `Bearer <paste your LINKEDIN_API_TOKEN>`
     - `Content-Type`: `application/json`
   - **Request Body**: `JSON`
     - `post` → Clipboard (the output of step 1, use the magic-variable picker)
     - `tone` → `casual`
3. **Get Dictionary Value** (action):
   - Input: Contents of URL (output of step 2)
   - Get: Value
   - Key: `text`
4. **Copy to Clipboard** (action):
   - Input: Dictionary Value (output of step 3)

Save, then add a keyboard shortcut (Mac) or add it to the Home Screen (iPhone). Flow:

- Copy a LinkedIn post.
- Trigger the Shortcut (hotkey on Mac, share-sheet or icon on iPhone).
- Wait 1–3 s.
- Paste the result.

For **Reply**, the same shape but:
- URL: `…/reply`
- Body key: `comment` instead of `post`
- Optional extra keys: `post_number` (integer) or `post_title` (string) — omit both for "latest post".

For other tones, duplicate the Shortcut and change the `tone` value (`professional`, `encouraging`, `thoughtprovoking`).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `401 missing bearer token` | Header missing or typo'd. Shortcuts: re-check the Authorization header has `Bearer ` prefix and the token value. |
| `503 LINKEDIN_API_TOKEN not set` | `.env` on the VM is missing the variable, or compose didn't pick it up. `docker compose down && up -d`. |
| `503 posts/ is empty` (on reply) | No post files matched the `NNN-slug.txt` pattern in `/root/linkedin/posts/`. Add one. |
| `502 upstream_error: Anthropic API: …` | Invalid or rate-limited `ANTHROPIC_API_KEY`. Check the key in `.env`. |
| `?` in clipboard instead of emojis | Shortcuts is correctly carrying UTF-8; if you see this, you copied via `pbcopy` somewhere in the chain. The HTTP path is clean. |
| Public URL hangs / 502 from Funnel | `tailscale funnel status` to confirm route is active. Restart with `tailscale funnel --bg 127.0.0.1:8081`. |
