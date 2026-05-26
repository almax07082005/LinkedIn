from anthropic import Anthropic, APIError

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 220


class GenerationError(Exception):
    pass


def generate_text(system: str, user: str) -> str:
    """Call Anthropic and return the full generated text. No I/O side effects."""
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
                chunks.append(text)
    except APIError as e:
        raise GenerationError(f"Anthropic API: {e}") from e
    return "".join(chunks).strip()
