# LinkedIn Comment Generator

An AI-powered Telegram Mini App that generates engaging LinkedIn comments in seconds. Paste a LinkedIn post, pick a tone, and get a ready-to-use comment powered by the Anthropic API.

> **Telegram Mini App only** — this app is designed exclusively to run inside Telegram as a Mini App. It will not work as a standalone web app because every request is authenticated via Telegram's `initData` HMAC-SHA256 mechanism. You must set it up as a Telegram bot with a Mini App configured.

## Features

- **4 tones**: Professional & Insightful, Casual & Friendly, Encouraging & Supportive, Thought-Provoking
- **Streaming output** — comment appears word by word in real time
- **One-tap copy** to clipboard
- **User whitelist** — only approved Telegram user IDs can access the app
- Built with Next.js 14, TypeScript, Tailwind CSS, and the Anthropic SDK

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A Telegram bot (create one via [@BotFather](https://t.me/BotFather))
- Your Telegram user ID(s) to whitelist (get yours from [@userinfobot](https://t.me/userinfobot))

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather — used to validate `initData` |
| `ALLOWED_USERS` | Comma-separated Telegram user IDs allowed to use the app (e.g. `123456789,987654321`) |

## Local Development

```bash
git clone https://github.com/almax07082005/LinkedIn.git
cd LinkedIn
npm install
cp .env.example .env.local   # fill in all three variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — note that the UI will work locally but Telegram auth validation is skipped unless you tunnel the URL and open it through Telegram.

## Deploying to Vercel

### 1. Push your code to GitHub

Make sure your repository is on GitHub (or GitLab / Bitbucket).

### 2. Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Select your GitHub repository and click **Import**.
4. Leave the framework preset as **Next.js** (auto-detected).
5. Click **Deploy** — the first deploy will fail because env vars are not set yet; that's fine.

### 3. Add environment variables

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add the following variables (select all environments: Production, Preview, Development):

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | `sk-ant-...` |
   | `TELEGRAM_BOT_TOKEN` | `123456:ABC-...` |
   | `ALLOWED_USERS` | `123456789,987654321` |

3. Click **Save** after adding each variable.

### 4. Redeploy

1. Go to the **Deployments** tab.
2. Find the latest deployment, click the three-dot menu, and select **Redeploy**.
3. Wait for the build to finish. Your app URL will look like `https://your-project.vercel.app`.

### 5. Configure the Telegram Mini App

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newapp` (or `/editapp` if you already have a bot).
3. Follow the prompts and set the **Web App URL** to your Vercel deployment URL (e.g. `https://your-project.vercel.app`).
4. BotFather will give you a direct Mini App link you can share with whitelisted users.

### 6. Test it

Open the Mini App link in Telegram. Only users whose Telegram ID is in `ALLOWED_USERS` will be able to generate comments.

## Project Structure

```
app/
  api/generate/route.ts   # Streaming POST endpoint — validates Telegram auth, calls Claude
  page.tsx                # Root page
  layout.tsx              # Root layout (injects Telegram Web App script)
  globals.css             # Global styles
components/
  CommentGenerator.tsx    # Main UI component
lib/
  telegram-auth.ts        # HMAC-SHA256 initData validation
```

## Contributing

Pull requests are welcome. For major changes please open an issue first.

## License

MIT
