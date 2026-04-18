import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: `Write like a seasoned industry expert sharing a sharp, specific insight.
- Keep it SHORT: 1-2 sentences max
- Use precise language and reference a concrete concept from the post
- Add one practical implication or counterpoint the author didn't mention
- Tone: authoritative but not arrogant
- Emojis: 1-2 relevant professional ones (📊 💡 🎯 🔑 etc.) placed naturally`,

  casual: `Write like a friendly colleague texting their thoughts after reading the post.
- Keep it SHORT: 1-2 sentences max
- Use contractions, relaxed grammar, first-person ("I", "we", "you")
- Sound spontaneous and genuine, like you typed it right away
- Tone: warm, relatable, conversational — zero corporate-speak
- Emojis: 2-3 expressive ones (😄 🙌 👏 🔥 💯 etc.) to show energy`,

  encouraging: `Write like a supportive mentor cheering someone on.
- Keep it SHORT: 1-2 sentences max
- Highlight a specific strength or effort you noticed in the post
- Make the author feel seen and motivated to keep going
- Tone: uplifting, sincere, celebratory — but specific, not generic
- Emojis: 2-3 warm, celebratory ones (🙌 🚀 ❤️ ✨ 💪 🎉 etc.)`,

  thoughtprovoking: `Write like a curious intellectual who wants to push the conversation deeper.
- Keep it SHORT: 1-2 sentences max
- Ask one sharp, open-ended question OR gently challenge an assumption
- Tone: respectfully provocative, intellectually honest
- Emojis: 1 subtle one that fits the question (🤔 💭 🧐 🌀 etc.)`,
};

export async function POST(req: NextRequest) {
  const { post, tone } = await req.json();

  if (!post?.trim()) {
    return new Response(JSON.stringify({ error: "Post text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 120,
    system: `You are a LinkedIn engagement expert. Write a single comment (2-4 sentences) for the given LinkedIn post.

${toneInstruction}

Rules: no hashtags, no "Great post!" opener, sound genuine. Return only the comment text — nothing else.`,
    messages: [{ role: "user", content: `LinkedIn post:\n\n${post.trim()}` }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
