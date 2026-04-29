import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { validateInitData, isAllowedUser } from "@/lib/telegram-auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_OUTPUT_CHARS = Math.max(
  80,
  parseInt(process.env.MAX_OUTPUT_CHARS ?? "350", 10) || 350,
);

const LENGTH_RULE = `HARD LENGTH LIMIT — read this first:
- Your entire response must be at most ${MAX_OUTPUT_CHARS} characters total (every character counts: letters, spaces, punctuation, emojis).
- Aim for roughly ${Math.round(MAX_OUTPUT_CHARS * 0.7)}–${MAX_OUTPUT_CHARS} characters. Shorter is fine; longer is forbidden.
- Before you finish, mentally check the length. If it exceeds ${MAX_OUTPUT_CHARS} characters, cut words until it fits.`;

const FORMATTING_RULE = `FORMATTING RULES (LinkedIn does NOT render Markdown):
- Do NOT use any Markdown syntax: no **bold**, no *italics*, no _underline_, no \`code\`, no #, no -, no >, no [text](url), no backticks.
- Plain text only. Line breaks are fine.
- If you need to bold a word, use Unicode mathematical bold characters that LinkedIn renders as bold (e.g. write "𝗴𝗿𝗼𝘄𝘁𝗵" instead of "**growth**"). Use Unicode bold sparingly, only for genuine emphasis.`;

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: `Write like a seasoned industry expert sharing a sharp, specific insight.
- Use precise language and reference a concrete concept from the post
- Add one practical implication or counterpoint the author didn't mention
- Tone: authoritative but not arrogant
- Emojis: 1-2 relevant professional ones (📊 💡 🎯 🔑 etc.) placed naturally`,

  casual: `Write like a friendly colleague texting their thoughts after reading the post.
- Use contractions, relaxed grammar, first-person ("I", "we", "you")
- Sound spontaneous and genuine, like you typed it right away
- Tone: warm, relatable, conversational — zero corporate-speak
- Emojis: 2-3 expressive ones (😄 🙌 👏 🔥 💯 etc.) to show energy`,

  encouraging: `Write like a supportive mentor cheering someone on.
- Highlight a specific strength or effort you noticed in the post
- Make the author feel seen and motivated to keep going
- Tone: uplifting, sincere, celebratory — but specific, not generic
- Emojis: 2-3 warm, celebratory ones (🙌 🚀 ❤️ ✨ 💪 🎉 etc.)`,

  thoughtprovoking: `Write like a curious intellectual who wants to push the conversation deeper.
- Ask one sharp, open-ended question OR gently challenge an assumption
- Tone: respectfully provocative, intellectually honest
- Emojis: 1 subtle one that fits the question (🤔 💭 🧐 🌀 etc.)`,
};

const REPLY_TONE_INSTRUCTIONS: Record<string, string> = {
  professional: `Write like a confident professional acknowledging a peer's insight on your own post.
- Reference something specific from the comment
- Add a brief forward-looking thought or thank them for the perspective
- Tone: warm but authoritative — this is your thread
- Emojis: 1 relevant one (🙏 💡 👏 🎯 etc.)`,

  casual: `Write like you're casually responding to a friend who commented on your post.
- Sound genuinely pleased they engaged — use contractions, first-person
- Optionally add a quick follow-up thought or question back to them
- Tone: warm, natural, spontaneous
- Emojis: 1-2 expressive ones (😄 🙌 💯 👋 etc.)`,

  encouraging: `Write like a gracious host appreciating someone who engaged with your content.
- Make the commenter feel their input was valuable and seen
- Invite further discussion if natural
- Tone: sincere, celebratory, never generic
- Emojis: 2-3 warm ones (🙏 ❤️ 🚀 ✨ 🎉 etc.)`,

  thoughtprovoking: `Write like a curious author engaging with a commenter who challenged or expanded your idea.
- Acknowledge their angle, then deepen the question or tension
- Tone: intellectually engaged, open-minded
- Emojis: 1 subtle one (🤔 💭 🧐 etc.)`,
};

export async function POST(req: NextRequest) {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const { valid, userId } = validateInitData(initData);

  if (!valid || !userId || !isAllowedUser(userId)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { post, tone, mode = "comment", myPost } = await req.json();

  if (!post?.trim()) {
    return new Response(JSON.stringify({ error: "Post text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let stream;

  if (mode === "reply") {
    if (!myPost?.trim()) {
      return new Response(JSON.stringify({ error: "Your post text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const replyToneInstruction =
      REPLY_TONE_INSTRUCTIONS[tone] ?? REPLY_TONE_INSTRUCTIONS.professional;

    stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 220,
      system: `You are a LinkedIn engagement expert. Write a reply from the post's AUTHOR to a commenter on their post.

${LENGTH_RULE}

${FORMATTING_RULE}

${replyToneInstruction}

Rules: no hashtags, no "Great comment!" opener, sound genuine. Return only the reply text — nothing else, and never more than ${MAX_OUTPUT_CHARS} characters.`,
      messages: [
        {
          role: "user",
          content: `Your original post:\n\n${myPost.trim()}\n\n---\n\nComment you are replying to:\n\n${post.trim()}\n\n---\n\nReminder: maximum ${MAX_OUTPUT_CHARS} characters total, no Markdown.`,
        },
      ],
    });
  } else {
    const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;

    stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 220,
      system: `You are a LinkedIn engagement expert. Write a single comment for the given LinkedIn post.

${LENGTH_RULE}

${FORMATTING_RULE}

${toneInstruction}

Rules: no hashtags, no "Great post!" opener, sound genuine. Return only the comment text — nothing else, and never more than ${MAX_OUTPUT_CHARS} characters.`,
      messages: [
        {
          role: "user",
          content: `LinkedIn post:\n\n${post.trim()}\n\n---\n\nReminder: maximum ${MAX_OUTPUT_CHARS} characters total, no Markdown.`,
        },
      ],
    });
  }

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
