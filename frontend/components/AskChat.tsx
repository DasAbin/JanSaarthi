"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Mic } from "lucide-react";
import { useAskChat } from "../hooks/useAskChat";
import { MicRecorder } from "./MicRecorder";
import { VoiceBar } from "./VoiceBar";
import { VOICE_LANGUAGES } from "../hooks/useVoice";

type Message = { role: "user" | "assistant"; text: string; sources?: { schemeName?: string }[] };

export default function AskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [showVoice, setShowVoice] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { mutate, data, isPending, error } = useAskChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, data]);

  useEffect(() => {
    if (data) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, sources: data.sources }
      ]);
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    mutate({ question: q, language });
  };

  const handleVoiceTranscript = (text: string) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
    setShowVoice(false);
  };

  const submitVoiceToAsk = (blob: Blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("language", language.includes("-") ? language : `${language}-IN`);
    const baseUrl = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000") : "http://localhost:4000";
    fetch(`${baseUrl}/api/voice/stt`, {
      method: "POST",
      body: formData
    })
      .then((r) => r.json())
      .then((d) => d.text && handleVoiceTranscript(d.text))
      .catch(() => {});
  };

  return (
    <div className="space-y-4" role="region" aria-label="Ask JanSaarthi">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ask JanSaarthi</h2>
          <p className="text-sm text-slate-600">
            Ask anything about government schemes in plain language.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            aria-label="Response language"
          >
            {VOICE_LANGUAGES.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowVoice(!showVoice)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            aria-label={showVoice ? "Hide voice input" : "Show voice input"}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {showVoice && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-4">
          <span className="text-sm font-medium text-slate-700">Tap to speak:</span>
          <MicRecorder onStop={submitVoiceToAsk} />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white min-h-[280px] max-h-[420px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <MessageCircle size={48} className="mb-4 text-indigo-200" />
            <p className="text-sm">Type or speak your question above.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/50">
                  <p className="text-xs font-medium text-slate-500 mb-1">Related schemes:</p>
                  <p className="text-xs text-slate-600">
                    {m.sources.map((s) => s.schemeName).filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {m.role === "assistant" && (
                <VoiceBar textToSpeak={m.text} defaultLang={language} />
              )}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <span className="text-sm text-slate-600 animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700" role="alert">
              {(error as Error)?.message || "Failed to get answer. Try again."}
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about schemes, eligibility, documents..."
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          aria-label="Question input"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send question"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
