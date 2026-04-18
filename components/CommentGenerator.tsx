"use client";

import { useEffect, useState } from "react";
import CommentTab from "./CommentTab";
import ReplyTab from "./ReplyTab";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        themeParams?: Record<string, string>;
      };
    };
  }
}

type Tab = "comment" | "reply";

export default function CommentGenerator() {
  const [initData, setInitData] = useState("");
  const [notInTelegram, setNotInTelegram] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("comment");
  const [tone, setTone] = useState("casual");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      setInitData(tg.initData);
      tg.ready?.();
      tg.expand?.();
    } else {
      setNotInTelegram(true);
    }
  }, []);

  if (notInTelegram) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-center text-slate-500 dark:text-slate-400">
          Please open this app through Telegram.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">
        LinkedIn AI Assistant
      </h1>

      {/* Tab bar */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-700">
        {(["comment", "reply"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px
              ${activeTab === tab
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "comment" ? (
        <CommentTab initData={initData} tone={tone} setTone={setTone} />
      ) : (
        <ReplyTab initData={initData} tone={tone} setTone={setTone} />
      )}
    </div>
  );
}
