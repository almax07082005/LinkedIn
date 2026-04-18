# LinkedIn Comment Generator

An open-source AI-powered tool that generates engaging LinkedIn comments in seconds. Paste a LinkedIn post, pick a tone, and get a ready-to-use comment via the Anthropic API.

## Features

- **4 tones**: Professional & Insightful, Casual & Friendly, Encouraging & Supportive, Thought-Provoking
- **Streaming output** — comment appears word by word in real time
- **One-tap copy** to clipboard
- **Telegram Mini App** compatible
- Built with Next.js 14, TypeScript, Tailwind CSS, and the Anthropic SDK

## Quick Start

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Local development

```bash
git clone https://github.com/almax07082005/LinkedIn.git
cd LinkedIn
npm install
cp .env.example .env.local   # then fill in your API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) |

## Project Structure

```
app/
  api/generate/route.ts   # Streaming POST endpoint
  page.tsx                # Root page
  layout.tsx              # Root layout
  globals.css             # Global styles
components/
  CommentGenerator.tsx    # Main UI component
```

## Deployment

See the deployment instructions section below or run the project on Vercel, Railway, or any Node.js host that supports Next.js.

## Contributing

Pull requests are welcome. For major changes please open an issue first.

## License

MIT
