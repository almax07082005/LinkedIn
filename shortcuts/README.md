# macOS Shortcuts setup

Bind `linkedin comment` and `linkedin reply` to keyboard shortcuts so you can fire them from anywhere — no terminal needed.

## One-time prep

After `uv tool install .` (see top-level [README.md](../README.md)), confirm where the binary lives:

```bash
which linkedin
# /Users/<you>/.local/bin/linkedin    (uv default)
```

Copy that absolute path — you'll paste it into Shortcuts. (Shortcuts.app doesn't read your shell's `PATH`, so the absolute path is required.)

## Create the Shortcut: "LinkedIn — Comment"

1. Open **Shortcuts.app** (`/Applications/Shortcuts.app`).
2. Click **+** to create a new shortcut.
3. Name it **LinkedIn — Comment**.
4. Search for the **Run Shell Script** action and drag it in.
5. Set:
   - **Shell**: `/bin/zsh`
   - **Pass input**: *(leave default — nothing)*
   - **Script**: paste the absolute path you copied, followed by ` comment`:
     ```
     /Users/<you>/.local/bin/linkedin comment
     ```
6. Click the **shortcut info** (ⓘ icon top-right) → **Add Keyboard Shortcut** → press your hotkey (e.g. **⌃⌥⌘C**).
7. Save.

Repeat for **LinkedIn — Reply**, this time with script body `… linkedin reply` and a different hotkey (e.g. **⌃⌥⌘R**).

## Optional: per-tone Shortcuts

Want one-keystroke access to non-default tones? Create extra Shortcuts with different scripts:

- `… linkedin comment --tone professional` → ⌃⌥⌘P
- `… linkedin comment --tone encouraging` → ⌃⌥⌘E
- `… linkedin comment --tone thoughtprovoking` → ⌃⌥⌘T

Same recipe — Run Shell Script action, absolute path + flags, assign hotkey.

## Test

1. Copy a sample LinkedIn post to your clipboard.
2. Press your **LinkedIn — Comment** hotkey.
3. Wait 1–2 seconds. macOS shows a small running indicator while Shortcuts runs the script.
4. Paste somewhere — you should see the generated comment.

If nothing happens or you get an error notification, check the **Run Shell Script** action — Shortcuts surfaces the script's stderr in the notification body. Common issues:

- Wrong path to `linkedin` — re-run `which linkedin` and update the action.
- `ANTHROPIC_API_KEY is not set` — make sure `.env` exists in the repo root with the key.
- `clipboard is empty` — you need to copy a post first.

## Why not ship a .shortcut file?

Apple's `.shortcut` export format is opaque, signed, and changes between OS versions, so a checked-in `.shortcut` file would rot fast and wouldn't diff in git. Two short steps in Shortcuts.app is the more reliable path.
