# linkedin

Tiny local CLI that turns LinkedIn posts and comments into draft replies via the Anthropic API. Designed to be wired up to a macOS Shortcut so a single hotkey runs the whole copy → generate → paste loop.

## What it does

```
linkedin comment [--tone TONE]
linkedin reply   [--tone TONE] [--post N | --title TEXT]
```

The CLI reads input from **stdin** and writes the generated text to **stdout**. It does not touch the clipboard itself — macOS Shortcuts handles that, which keeps emojis and Unicode bold characters intact (Apple's `pbcopy`/`pbpaste` mangle them depending on locale).

- **`linkedin comment`** — stdin is the LinkedIn post you want to comment on; stdout is the generated comment.
- **`linkedin reply`** — stdin is the incoming comment on YOUR post; stdout is an author-voice reply. The CLI picks one of *your* posts from the `posts/` folder (latest by default) to use as context. `--post 3` picks post `003-...txt`; `--title onboarding` picks the post whose filename slug contains "onboarding" (case-insensitive). The two selectors are mutually exclusive.

Default tone is `casual`. Override with `--tone professional`, `--tone encouraging`, or `--tone thoughtprovoking`.

## Install

Requires Python 3.10+ and [`uv`](https://docs.astral.sh/uv/) (or `pipx`).

```bash
brew install uv                      # if you don't have it
uv tool install --editable .         # from the repo root — installs `linkedin` into ~/.local/bin
cp .env.example .env
# edit .env and paste your ANTHROPIC_API_KEY
```

The `--editable` flag is important: the CLI resolves `posts/` and `.env` relative to its package location, so it needs to point back at this repo (not the uv tool's site-packages). If you ever move the repo, run `uv tool install --reinstall --editable .` from the new location.

## Try it from a terminal

```bash
echo "We just hit 100 customers..." | linkedin comment
```

You'll see the generated comment stream to stdout. Pipe through `pbcopy` if you want to capture it manually, but the real workflow is via Shortcuts (next section).

## macOS Shortcuts setup

See [shortcuts/README.md](shortcuts/README.md) for binding `linkedin comment` and `linkedin reply` to keyboard shortcuts. The Shortcut configuration is the standard "Get Clipboard → Run Shell Script (input via stdin) → Copy to Clipboard" pattern, which preserves UTF-8 emoji and Unicode bold characters that go through `pbcopy` directly would corrupt.

## Posts folder

`posts/` lives next to this README. Add one file per LinkedIn post you've written, named `<number>-<slug>.txt`:

```
posts/
├── 001-how-i-shipped-x.txt
├── 002-three-lessons-from-q1.txt
└── 003-why-async-meetings-work.txt
```

File contents are **LinkedIn-verbatim** — exactly what you posted, including Unicode bold characters (`𝗴𝗿𝗼𝘄𝘁𝗵`) and line breaks. No Markdown, no frontmatter. The CLI never writes to this folder; you manage it by hand (or, later, via the writer flow).

`reply` defaults to the highest-numbered post. With no posts present, `reply` errors clearly. `comment` doesn't touch `posts/` at all.

## Configuration

`.env` in the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

That's it. The CLI loads `.env` from this directory regardless of where it's invoked from, so it works fine when called from a macOS Shortcut.

## Errors

The CLI exits non-zero with a stderr message on:

- empty stdin
- missing `ANTHROPIC_API_KEY`
- `linkedin reply` with empty `posts/`
- `--post N` / `--title TEXT` that doesn't match anything (or matches more than one for title)
- Anthropic API failures

macOS Shortcuts surfaces non-zero exits as a notification, so failures show up even when there's no terminal open.
