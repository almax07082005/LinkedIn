"use client";

import { useRef, useState } from "react";

const TONES = [
  { value: "professional", label: "Professional & Insightful" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "encouraging", label: "Encouraging & Supportive" },
  { value: "thoughtprovoking", label: "Thought-Provoking" },
];

interface CommentTabProps {
  initData: string;
  tone: string;
  setTone: (t: string) => void;
}

export default function CommentTab({ initData, tone, setTone }: CommentTabProps) {
  const [post, setPost] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleCopy() {
    if (!comment) return;
    try {
      await navigator.clipboard.writeText(comment);
    } catch {
      const el = document.createElement("textarea");
      el.value = comment;
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
    if (!post.trim()) {
      setError("Please enter a LinkedIn post first.");
      return;
    }
    setError("");
    setComment("");
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
        body: JSON.stringify({ post, tone, mode: "comment" }),
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
        setComment(result);
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
      {/* Post input */}
      <section className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold" htmlFor="post">
            LinkedIn Post
          </label>
          <button
            onClick={() => { setPost(""); setComment(""); }}
            disabled={!post}
            className="rounded px-3 py-1 text-xs font-medium transition-colors
              bg-slate-100 hover:bg-red-100 hover:text-red-600 active:bg-red-200
              disabled:cursor-not-allowed disabled:opacity-40
              dark:bg-slate-700 dark:hover:bg-red-900/40 dark:hover:text-red-400"
          >
            Clear
          </button>
        </div>
        <textarea
          id="post"
          rows={3}
          autoFocus
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder="Paste or type the LinkedIn post here…"
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
            dark:border-slate-600 dark:bg-slate-800"
        />
      </section>

      {/* Tone selector */}
      <section className="mb-4">
        <label className="mb-1 block text-sm font-semibold" htmlFor="tone">
          Tone
        </label>
        <select
          id="tone"
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
        {loading ? "Generating…" : "Generate Comment"}
      </button>

      {/* Error */}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">
          {error}
        </p>
      )}

      {/* Comment output */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold" htmlFor="comment">
            Generated Comment
          </label>
          <button
            onClick={handleCopy}
            disabled={!comment}
            className="rounded px-3 py-1 text-xs font-semibold transition-all
              disabled:cursor-not-allowed disabled:opacity-40
              bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {copyFeedback ? "Copied!" : "Copy"}
          </button>
        </div>
        <textarea
          id="comment"
          rows={6}
          value={comment}
          readOnly
          placeholder="Your comment will appear here…"
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-base
            resize-none focus:outline-none
            dark:border-slate-600 dark:bg-slate-800/50"
        />
      </section>
    </div>
  );
}
