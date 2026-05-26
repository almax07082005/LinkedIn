import subprocess


class EmptyClipboardError(Exception):
    pass


def read_clipboard() -> str:
    result = subprocess.run(
        ["pbpaste"], check=True, capture_output=True, text=True
    )
    text = result.stdout.rstrip("\n")
    if not text.strip():
        raise EmptyClipboardError(
            "clipboard is empty — copy a LinkedIn post (or comment) first"
        )
    return text


def write_clipboard(text: str) -> None:
    subprocess.run(["pbcopy"], input=text, text=True, check=True)
