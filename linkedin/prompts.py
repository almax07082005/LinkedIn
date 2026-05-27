MAX_OUTPUT_CHARS = 200

LENGTH_RULE = f"""HARD LENGTH LIMIT — read this first:
- Your entire response must be at most {MAX_OUTPUT_CHARS} characters total (every character counts: letters, spaces, punctuation, emojis).
- Aim for roughly {round(MAX_OUTPUT_CHARS * 0.7)}–{MAX_OUTPUT_CHARS} characters. Shorter is fine; longer is forbidden.
- Before you finish, mentally check the length. If it exceeds {MAX_OUTPUT_CHARS} characters, cut words until it fits."""

FORMATTING_RULE = """FORMATTING RULES (LinkedIn does NOT render Markdown):
- Do NOT use any Markdown syntax: no **bold**, no *italics*, no _underline_, no `code`, no #, no -, no >, no [text](url), no backticks.
- Plain text only. Line breaks are fine.
- If you need to bold a word, use Unicode mathematical bold characters that LinkedIn renders as bold (e.g. write "𝗴𝗿𝗼𝘄𝘁𝗵" instead of "**growth**"). Use Unicode bold sparingly, only for genuine emphasis."""

TONE_COMMENT = """Write like a friendly colleague texting their thoughts after reading the post.
- Use contractions, relaxed grammar, first-person ("I", "we", "you")
- Sound spontaneous and genuine, like you typed it right away
- Tone: warm, relatable, conversational — zero corporate-speak
- Emojis: 2-3 expressive ones (😄 🙌 👏 🔥 💯 etc.) to show energy"""

TONE_REPLY = """Write like you're casually responding to a friend who commented on your post.
- Sound genuinely pleased they engaged — use contractions, first-person
- Optionally add a quick follow-up thought or question back to them
- Tone: warm, natural, spontaneous
- Emojis: 1-2 expressive ones (😄 🙌 💯 👋 etc.)"""


def build_comment_prompt(post: str) -> dict[str, str]:
    system = f"""You are a LinkedIn engagement expert. Write a single comment for the given LinkedIn post.

{LENGTH_RULE}

{FORMATTING_RULE}

{TONE_COMMENT}

Rules: no hashtags, no "Great post!" opener, sound genuine. Return only the comment text — nothing else, and never more than {MAX_OUTPUT_CHARS} characters."""
    user = (
        f"LinkedIn post:\n\n{post.strip()}\n\n"
        f"---\n\n"
        f"Reminder: maximum {MAX_OUTPUT_CHARS} characters total, no Markdown."
    )
    return {"system": system, "user": user}


def build_reply_prompt(my_post: str, incoming_comment: str) -> dict[str, str]:
    system = f"""You are a LinkedIn engagement expert. Write a reply from the post's AUTHOR to a commenter on their post.

{LENGTH_RULE}

{FORMATTING_RULE}

{TONE_REPLY}

Rules: no hashtags, no "Great comment!" opener, sound genuine. Return only the reply text — nothing else, and never more than {MAX_OUTPUT_CHARS} characters."""
    user = (
        f"Your original post:\n\n{my_post.strip()}\n\n"
        f"---\n\n"
        f"Comment you are replying to:\n\n{incoming_comment.strip()}\n\n"
        f"---\n\n"
        f"Reminder: maximum {MAX_OUTPUT_CHARS} characters total, no Markdown."
    )
    return {"system": system, "user": user}
