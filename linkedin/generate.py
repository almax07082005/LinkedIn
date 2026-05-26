import sys

from anthropic import Anthropic, APIError

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 220


class GenerationError(Exception):
    pass


def generate(system: str, user: str) -> str:
    client = Anthropic()
    chunks: list[str] = []
    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}],
        ) as stream:
            for text in stream.text_stream:
                sys.stdout.write(text)
                sys.stdout.flush()
                chunks.append(text)
    except APIError as e:
        raise GenerationError(f"Anthropic API: {e}") from e
    sys.stdout.write("\n")
    sys.stdout.flush()
    return "".join(chunks)
