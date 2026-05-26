# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small Python CLI named `linkedin` with two subcommands:

- `linkedin comment [--tone TONE]` — clipboard → comment → clipboard.
- `linkedin reply [--tone TONE] [--post N | --title TEXT]` — clipboard (= incoming comment) + a post from `posts/` (latest by default) → reply → clipboard.

Tones: `professional`, `casual` (default), `encouraging`, `thoughtprovoking`. `--post` and `--title` are mutually exclusive.

## Stack

- Python 3.10+, single package `linkedin/`.
- Only runtime dep: `anthropic` (Python SDK).
- Distributed via `uv tool install .` (or `pipx install .`).
- macOS-only (clipboard uses `pbpaste` / `pbcopy`).

## Commands

```bash
uv tool install --editable .              # install (editable, so __file__ points back at the repo)
uv tool install --reinstall --editable .  # force reinstall after dependency edits
linkedin comment                          # smoke test
linkedin reply --help                     # arg surface
```

The `--editable` flag matters: `posts.py` and `cli.py` use `Path(__file__).resolve().parent.parent` to find `posts/` and `.env`, which only works if the installed package symlinks back to this repo.

To run without installing (during development):

```bash
uv run python -m linkedin comment
```

## Architecture

```
linkedin/
├── cli.py         # argparse, subcommand dispatch, .env loading, error formatting
├── prompts.py     # MAX_OUTPUT_CHARS=200, all four tone blocks, comment + reply prompt builders
├── generate.py    # Anthropic streaming call (model=claude-sonnet-4-6, max_tokens=220)
├── posts.py       # posts/ loader: list_posts, latest_post, post_by_number, post_by_title
└── clipboard.py   # pbpaste / pbcopy wrappers + EmptyClipboardError
```

Posts live in `posts/` next to the package, named `<number>-<slug>.txt`. The CLI **reads** posts but never writes to that folder.

## Prompts (do not silently drift)

The prompt structure is a direct port of the previous web app:

- A hard length limit (≤200 chars total, aim 70–100% of limit).
- Anti-Markdown formatting rule (LinkedIn doesn't render it; Unicode bold characters are allowed sparingly).
- A tone-specific block.
- A "no hashtags, no 'Great post!' opener" closer.

When tweaking prompts, edit `prompts.py` only — `generate.py` is dumb glue.

## Environment

`.env` in the repo root with `ANTHROPIC_API_KEY=...`. Loaded by `cli.py` via a hand-rolled parser (no `python-dotenv` dep) at startup, resolved relative to the package directory so it works regardless of cwd (important for macOS Shortcut invocations).

## Branch history

The current branch (`scripted`) is an **orphan** branch — no shared history with `master`. `master` still holds the previous Next.js / Telegram Mini App version of this project, kept as a record.
