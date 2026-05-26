import re
from dataclasses import dataclass
from pathlib import Path

POSTS_DIR = Path(__file__).resolve().parent.parent / "posts"
FILENAME_RE = re.compile(r"^(\d+)-(.+)\.txt$")


class PostsEmptyError(Exception):
    pass


class PostNotFoundError(Exception):
    pass


class AmbiguousTitleError(Exception):
    pass


@dataclass(frozen=True)
class Post:
    number: int
    title: str
    path: Path

    @property
    def body(self) -> str:
        return self.path.read_text(encoding="utf-8").strip()


def list_posts() -> list[Post]:
    if not POSTS_DIR.exists():
        return []
    posts = []
    for entry in POSTS_DIR.iterdir():
        if not entry.is_file():
            continue
        m = FILENAME_RE.match(entry.name)
        if not m:
            continue
        posts.append(Post(number=int(m.group(1)), title=m.group(2), path=entry))
    posts.sort(key=lambda p: p.number)
    return posts


def latest_post() -> Post:
    posts = list_posts()
    if not posts:
        raise PostsEmptyError(
            "posts/ is empty — add a post file like 001-my-post.txt"
        )
    return posts[-1]


def post_by_number(n: int) -> Post:
    for p in list_posts():
        if p.number == n:
            return p
    available = ", ".join(str(p.number) for p in list_posts()) or "(none)"
    raise PostNotFoundError(f"no post with number {n} (available: {available})")


def post_by_title(query: str) -> Post:
    q = query.lower()
    matches = [p for p in list_posts() if q in p.title.lower()]
    if not matches:
        available = ", ".join(p.title for p in list_posts()) or "(none)"
        raise PostNotFoundError(
            f"no post title matches '{query}' (available: {available})"
        )
    if len(matches) > 1:
        candidates = ", ".join(f"{p.number}-{p.title}" for p in matches)
        raise AmbiguousTitleError(
            f"'{query}' matches multiple posts: {candidates}"
        )
    return matches[0]
