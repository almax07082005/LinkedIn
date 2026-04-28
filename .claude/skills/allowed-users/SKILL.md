---
name: allowed-users
description: Manage ALLOWED_USERS on Vercel — add or remove a Telegram user ID from the production whitelist and redeploy. Use when the user says "/allowed-users add <id>", "/allowed-users remove <id>", "allow this Telegram user", "whitelist user", or "remove user from allowed list".
---

# allowed-users

Update the `ALLOWED_USERS` environment variable on Vercel and redeploy to production.

## Usage

- To **add** a user ID: `/allowed-users add 1234567890`
- To **remove** a user ID: `/allowed-users remove 1234567890`

## Steps

You will be given an action (`add` or `remove`) and a Telegram user ID as `$ARGUMENTS`.

1. Parse the arguments: first word is the action (`add`/`remove`), second word is the user ID.
2. Read the current `ALLOWED_USERS` value from `.env.local`.
3. Apply the change:
   - **add**: append the ID with a comma if not already present; error if already present.
   - **remove**: remove the ID from the list; error if not found.
4. Update `.env.local` with the new value.
5. Remove `ALLOWED_USERS` from Vercel production using: `npx vercel env rm ALLOWED_USERS production --yes`
6. Re-add it using: `echo "<new_value>" | npx vercel env add ALLOWED_USERS production`
7. Redeploy to production using: `npx vercel --prod`
8. Report the final `ALLOWED_USERS` value and the deployment URL.

Do **not** commit `.env.local` to git. Do not prompt for confirmation — execute all steps automatically.
