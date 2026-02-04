"use client";

import { useState } from "react";
import { useSimplifyDocument } from "../../hooks/useSimplifyDocument";
import { VoiceBar } from "../../components/VoiceBar";
import { VOICE_LANGUAGES } from "../../hooks/useVoice";

function getLocalLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || (navigator as any).userLanguage || "";
  if (lang.startsWith("hi")) return "hi";
  if (lang.startsWith("mr")) return "mr";
  if (lang.startsWith("ta")) return "ta";
  if (lang.startsWith("te")) return "te";
  if (lang.startsWith("bn")) return "bn";
  if (lang.startsWith("gu")) return "gu";
  if (lang.startsWith("kn")) return "kn";
  if (lang.startsWith("ml")) return "ml";
  if (lang.startsWith("pa")) return "pa";
  if (lang.startsWith("or")) return "or";
  return "en";
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState(() => (typeof navigator !== "undefined" ? getLocalLanguage() : "en"));
  const { mutate, data, isPending, isError, error } = useSimplifyDocument();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    mutate({ file, language });
  };

  const fullText =
    data &&
    [data.summary, "", data.eli10, "", ...(data.keyPoints || [])].join("\n");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4" role="main" aria-label="Document Simplifier">
      <h1 className="text-xl font-semibold">Document Simplifier</h1>
      <p className="text-sm text-slate-600">
        Upload a PDF or image for a simple summary. Supports Indian languages; long documents are summarized in one shot for speed.
      </p>
      <form
        onSubmit={onSubmit}
        className="card p-4 space-y-3 flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">
            Upload PDF or Image
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm"
              accept=".pdf,image/*"
              aria-describedby="upload-hint"
            />
          </label>
          <p id="upload-hint" className="text-xs text-slate-500 sr-only">
            PDF or image files
          </p>
          <label className="text-sm font-medium block">
            Document language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input mt-1"
              aria-label="Document language"
            >
              {VOICE_LANGUAGES.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn-primary w-full sm:w-auto" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Processing…" : "Simplify"}
        </button>
      </form>

      {isError && (
        <p className="text-sm text-red-600" role="alert">
          {error instanceof Error ? error.message : "Failed to simplify document. Check your connection and try again."}
        </p>
      )}

      {data && (
        <section className="card p-4 space-y-3" aria-label="Summary">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Summary</h2>
            <VoiceBar textToSpeak={fullText || ""} defaultLang={language} />
          </div>
          <p className="text-sm whitespace-pre-wrap">{data.summary}</p>

          <h3 className="text-md font-semibold">Explain like I&apos;m 10</h3>
          <p className="text-sm whitespace-pre-wrap">{data.eli10}</p>

          <h3 className="text-md font-semibold">Key Points</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {data.keyPoints?.map((p: string, idx: number) => (
              <li key={idx}>{p}</li>
            ))}
          </ul>

          <h3 className="text-md font-semibold">Steps to Take</h3>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            {data.steps?.map((p: string, idx: number) => (
              <li key={idx}>{p}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

