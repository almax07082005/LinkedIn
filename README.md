# linkedin

Tiny local CLI that turns clipboard content into LinkedIn comments and replies. One keystroke, generated text already in your clipboard, ready to paste.

## What it does

```
linkedin comment [--tone TONE]
linkedin reply   [--tone TONE] [--post N | --title TEXT]
```

- **`linkedin comment`** — reads the LinkedIn post in your clipboard, generates a single comment, copies it back to the clipboard.
- **`linkedin reply`** — reads the incoming comment in your clipboard, pulls one of *your own* posts from the `posts/` folder (latest by default), generates an author-voice reply, copies it back. `--post 3` picks post `003-...txt`; `--title onboarding` picks the post whose filename slug contains "onboarding" (case-insensitive). The two selectors are mutually exclusive.

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

Verify:

```bash
which linkedin
linkedin comment --help
```

If `uv` isn't your thing, `pipx install .` works the same way.

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

## macOS Shortcuts setup

See [shortcuts/README.md](shortcuts/README.md) for binding `linkedin comment` and `linkedin reply` to keyboard shortcuts via the Shortcuts app.

## Configuration

`.env` in the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

That's it. The CLI loads `.env` from this directory regardless of where it's invoked from, so it works fine when called from a macOS Shortcut.

## Errors

The CLI exits non-zero with a stderr message on:

- empty clipboard
- missing `ANTHROPIC_API_KEY`
- `linkedin reply` with empty `posts/`
- `--post N` / `--title TEXT` that doesn't match anything (or matches more than one for title)
- Anthropic API failures

macOS Shortcuts surfaces non-zero exits as a notification, so failures show up even when there's no terminal open.
