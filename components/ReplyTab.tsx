"use client";

import { useEffect, useRef, useState } from "react";

const LS_KEY = "linkedin_reply_my_post";

const TONES = [
  { value: "professional", label: "Professional & Insightful" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "encouraging", label: "Encouraging & Supportive" },
  { value: "thoughtprovoking", label: "Thought-Provoking" },
];

interface ReplyTabProps {
  initData: string;
  tone: string;
  setTone: (t: string) => void;
}

export default function ReplyTab({ initData, tone, setTone }: ReplyTabProps) {
  const [myPost, setMyPost] = useState("");
  const [commentText, setCommentText] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setMyPost(saved);
  }, []);

  function handleMyPostChange(val: string) {
    setMyPost(val);
    if (val) {
      localStorage.setItem(LS_KEY, val);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }

  async function handleCopy() {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
    } catch {
      const el = document.createElement("textarea");
      el.value = reply;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }

  async function handleGenerate() {
    if (!myPost.trim()) {
      setError("Please enter your LinkedIn post first.");
      return;
    }
    if (!commentText.trim()) {
      setError("Please enter the comment you want to reply to.");
      return;
    }
    setError("");
    setReply("");
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ post: commentText, myPost, tone, mode: "reply" }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setReply(result);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* User's own post */}
      <section className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold" htmlFor="my-post">
            Your Post
          </label>
          <button
            onClick={() => handleMyPostChange("")}
            disabled={!myPost}
            className="rounded px-3 py-1 text-xs font-medium transition-colors
              bg-slate-100 hover:bg-red-100 hover:text-red-600 active:bg-red-200
              disabled:cursor-not-allowed disabled:opacity-40
              dark:bg-slate-700 dark:hover:bg-red-900/40 dark:hover:text-red-400"
          >
            Clear
          </button>
        </div>
        <textarea
          id="my-post"
          rows={3}
          value={myPost}
          onChange={(e) => handleMyPostChange(e.target.value)}
          placeholder="Paste your own LinkedIn post here… (saved automatically)"
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
            dark:border-slate-600 dark:bg-slate-800"
        />
      </section>

      {/* Comment to reply to */}
      <section className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold" htmlFor="comment-text">
            Comment on Your Post
          </label>
          <button
            onClick={() => { setCommentText(""); setReply(""); }}
            disabled={!commentText}
            className="rounded px-3 py-1 text-xs font-medium transition-colors
              bg-slate-100 hover:bg-red-100 hover:text-red-600 active:bg-red-200
              disabled:cursor-not-allowed disabled:opacity-40
              dark:bg-slate-700 dark:hover:bg-red-900/40 dark:hover:text-red-400"
          >
            Clear
          </button>
        </div>
        <textarea
          id="comment-text"
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Paste the comment you want to reply to…"
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
            dark:border-slate-600 dark:bg-slate-800"
        />
      </section>

      {/* Tone selector */}
      <section className="mb-4">
        <label className="mb-1 block text-sm font-semibold" htmlFor="reply-tone">
          Tone
        </label>
        <select
          id="reply-tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            dark:border-slate-600 dark:bg-slate-800"
        >
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </section>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mb-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold
          text-white transition-colors hover:bg-blue-700 active:bg-blue-800
          disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate Reply"}
      </button>

      {/* Error */}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">
          {error}
        </p>
      )}

      {/* Reply output */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold" htmlFor="reply">
            Generated Reply
          </label>
          <button
            onClick={handleCopy}
            disabled={!reply}
            className="rounded px-3 py-1 text-xs font-semibold transition-all
              disabled:cursor-not-allowed disabled:opacity-40
              bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {copyFeedback ? "Copied!" : "Copy"}
          </button>
        </div>
        <textarea
          id="reply"
          rows={6}
          value={reply}
          readOnly
          placeholder="Your reply will appear here…"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-base
            resize-none focus:outline-none
            dark:border-slate-600 dark:bg-slate-800/50"
        />
      </section>
    </div>
  );
}
