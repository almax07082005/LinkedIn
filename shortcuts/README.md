# macOS Shortcuts setup

Bind `linkedin comment` and `linkedin reply` to keyboard shortcuts so you can fire them from anywhere — no terminal needed.

The Shortcut handles the clipboard at both ends, so we don't call `pbpaste` / `pbcopy` directly (they have UTF-8 quirks that mangle emojis depending on the calling process's locale).

## One-time prep

After `uv tool install --editable .` (see top-level [README.md](../README.md)), confirm where the binary lives:

```bash
which linkedin
# /Users/<you>/.local/bin/linkedin    (uv default)
```

Copy that absolute path — you'll paste it into Shortcuts. (Shortcuts.app doesn't read your shell's `PATH`, so the absolute path is required.)

## Create the Shortcut: "LinkedIn — Comment"

1. Open **Shortcuts.app** (`/Applications/Shortcuts.app`).
2. Click **+** to create a new shortcut.
3. Name it **LinkedIn — Comment**.
4. Add these three actions in order:

   **Action 1 — "Get Clipboard"**
   - Search "Clipboard" in the action library, drag in **Get Clipboard**.

   **Action 2 — "Run Shell Script"**
   - Search "Shell" and drag in **Run Shell Script**.
   - **Shell**: `/bin/zsh`
   - **Pass Input**: `to stdin`
   - **Input**: should auto-fill to "Clipboard" (the output of action 1). If not, click the input field and pick **Clipboard**.
   - **Script** (paste the absolute path you copied):
     ```
     /Users/<you>/.local/bin/linkedin comment
     ```

   **Action 3 — "Copy to Clipboard"**
   - Search "Clipboard" and drag in **Copy to Clipboard**.
   - **Input**: should auto-fill to "Shell Script Result" (the output of action 2).

5. Click the **shortcut info** icon (top-right toolbar) → **Add Keyboard Shortcut** → press your hotkey (e.g. **⌃⌥⌘C**).
6. Save.

Repeat for **LinkedIn — Reply**, this time with script body `… linkedin reply` and a different hotkey (e.g. **⌃⌥⌘R**).

## Test

1. Copy a sample LinkedIn post to your clipboard.
2. Press your **LinkedIn — Comment** hotkey.
3. Wait 1–3 seconds. macOS shows a small running indicator while Shortcuts runs the script.
4. Paste somewhere — you should see the generated comment, emojis and all.

If nothing happens or you get an error notification, Shortcuts surfaces the script's stderr in the notification. Common issues:

- Wrong path to `linkedin` — re-run `which linkedin` and update the action.
- `ANTHROPIC_API_KEY is not set` — make sure `.env` exists in the repo root with the key.
- `no input on stdin` — the Run Shell Script action's **Input** field isn't wired to the Get Clipboard step. Click it and pick **Clipboard**.

## Why not ship a .shortcut file?

Apple's `.shortcut` export format is opaque, signed, and changes between OS versions, so a checked-in `.shortcut` file would rot fast and wouldn't diff in git. Three short steps in Shortcuts.app is the more reliable path.
