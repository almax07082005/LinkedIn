"""FastAPI server exposing the LinkedIn comment / reply generator over HTTP.

Endpoints (all return JSON):
    GET  /healthz                 — open, returns {"ok": true}
    POST /comment                 — auth, generates a comment from {"post"}
    POST /reply                   — auth, generates a reply from {"comment", "post_number"|"post_title"}

Auth: every protected endpoint requires `Authorization: Bearer <LINKEDIN_API_TOKEN>`.
Token is read from the LINKEDIN_API_TOKEN env var at request time.
"""

from __future__ import annotations

import hmac
import os
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import generate, posts, prompts

app = FastAPI(
    title="linkedin",
    description="Generate LinkedIn comments and replies via the Anthropic API.",
    version="0.2.0",
)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def require_bearer(authorization: str = Header(default="")) -> None:
    expected = os.environ.get("LINKEDIN_API_TOKEN", "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail={"error": "server misconfigured: LINKEDIN_API_TOKEN not set", "code": "no_token"},
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "missing bearer token", "code": "unauthorized"},
        )
    provided = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid token", "code": "unauthorized"},
        )


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class CommentRequest(BaseModel):
    post: str = Field(..., min_length=1, description="The LinkedIn post text to comment on.")


class CommentResponse(BaseModel):
    text: str
    chars: int


class ReplyRequest(BaseModel):
    comment: str = Field(..., min_length=1, description="The incoming comment you are replying to.")
    post_number: Optional[int] = Field(default=None, description="Use post #N from posts/.")
    post_title: Optional[str] = Field(default=None, description="Use the post whose slug contains this text.")


class ReplyResponse(BaseModel):
    text: str
    chars: int
    post_used: str


# ---------------------------------------------------------------------------
# Error helpers
# ---------------------------------------------------------------------------


def bad_request(msg: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"error": msg, "code": "bad_request"})


def upstream_error(msg: str) -> HTTPException:
    return HTTPException(status_code=502, detail={"error": msg, "code": "upstream_error"})


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.post("/comment", response_model=CommentResponse, dependencies=[Depends(require_bearer)])
def comment(req: CommentRequest) -> CommentResponse:
    p = prompts.build_comment_prompt(req.post)
    try:
        text = generate.generate_text(p["system"], p["user"])
    except generate.GenerationError as e:
        raise upstream_error(str(e))
    return CommentResponse(text=text, chars=len(text))


@app.post("/reply", response_model=ReplyResponse, dependencies=[Depends(require_bearer)])
def reply(req: ReplyRequest) -> ReplyResponse:
    if req.post_number is not None and req.post_title is not None:
        raise bad_request("pass at most one of post_number or post_title")

    try:
        if req.post_number is not None:
            chosen = posts.post_by_number(req.post_number)
        elif req.post_title is not None:
            chosen = posts.post_by_title(req.post_title)
        else:
            chosen = posts.latest_post()
    except posts.PostsEmptyError as e:
        raise HTTPException(status_code=503, detail={"error": str(e), "code": "posts_empty"})
    except posts.PostNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": str(e), "code": "post_not_found"})
    except posts.AmbiguousTitleError as e:
        raise HTTPException(status_code=409, detail={"error": str(e), "code": "ambiguous_title"})

    p = prompts.build_reply_prompt(chosen.body, req.comment)
    try:
        text = generate.generate_text(p["system"], p["user"])
    except generate.GenerationError as e:
        raise upstream_error(str(e))

    return ReplyResponse(
        text=text,
        chars=len(text),
        post_used=f"{chosen.number:03d}-{chosen.title}",
    )


# ---------------------------------------------------------------------------
# Dev entrypoint — `python -m linkedin.server` or `linkedin-server`
# ---------------------------------------------------------------------------


def run() -> None:
    import uvicorn

    uvicorn.run(
        "linkedin.server:app",
        host=os.environ.get("LINKEDIN_HOST", "127.0.0.1"),
        port=int(os.environ.get("LINKEDIN_PORT", "8081")),
        reload=False,
    )


if __name__ == "__main__":
    run()
