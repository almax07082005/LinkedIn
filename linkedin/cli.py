import argparse
import os
import sys
from pathlib import Path

from . import clipboard, generate, posts, prompts

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env() -> None:
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="linkedin",
        description="Generate LinkedIn comments and replies from your clipboard.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    comment = sub.add_parser(
        "comment", help="Generate a comment for the post in your clipboard."
    )
    comment.add_argument(
        "--tone",
        choices=prompts.TONES,
        default=prompts.DEFAULT_TONE,
        help=f"Tone (default: {prompts.DEFAULT_TONE}).",
    )

    reply = sub.add_parser(
        "reply",
        help="Reply to the comment in your clipboard, using one of your posts as context.",
    )
    reply.add_argument(
        "--tone",
        choices=prompts.TONES,
        default=prompts.DEFAULT_TONE,
        help=f"Tone (default: {prompts.DEFAULT_TONE}).",
    )
    post_selector = reply.add_mutually_exclusive_group()
    post_selector.add_argument(
        "--post", type=int, metavar="N", help="Use post #N from posts/."
    )
    post_selector.add_argument(
        "--title",
        metavar="TEXT",
        help="Use the post whose slug contains TEXT (case-insensitive).",
    )

    return parser


def cmd_comment(tone: str) -> None:
    try:
        post_text = clipboard.read_clipboard()
    except clipboard.EmptyClipboardError as e:
        die(str(e))

    p = prompts.build_comment_prompt(post_text, tone)
    try:
        output = generate.generate(p["system"], p["user"])
    except generate.GenerationError as e:
        die(str(e))
    clipboard.write_clipboard(output.strip())
    print("→ copied to clipboard")


def cmd_reply(tone: str, post_number: int | None, post_title: str | None) -> None:
    try:
        incoming = clipboard.read_clipboard()
    except clipboard.EmptyClipboardError as e:
        die(str(e))

    try:
        if post_number is not None:
            chosen = posts.post_by_number(post_number)
        elif post_title is not None:
            chosen = posts.post_by_title(post_title)
        else:
            chosen = posts.latest_post()
    except (posts.PostsEmptyError, posts.PostNotFoundError, posts.AmbiguousTitleError) as e:
        die(str(e))

    print(f"(replying to comment using post {chosen.number}-{chosen.title})\n", file=sys.stderr)

    p = prompts.build_reply_prompt(chosen.body, incoming, tone)
    try:
        output = generate.generate(p["system"], p["user"])
    except generate.GenerationError as e:
        die(str(e))
    clipboard.write_clipboard(output.strip())
    print("→ copied to clipboard")


def main() -> None:
    args = build_parser().parse_args()

    load_env()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        die("ANTHROPIC_API_KEY is not set (add it to .env or export it)")

    if args.command == "comment":
        cmd_comment(args.tone)
    elif args.command == "reply":
        cmd_reply(args.tone, args.post, args.title)
