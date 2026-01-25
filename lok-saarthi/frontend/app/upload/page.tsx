"use client";

import { useState } from "react";
import { useSimplifyDocument } from "../../hooks/useSimplifyDocument";
import { VoiceBar } from "../../components/VoiceBar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const { mutate, data, isPending } = useSimplifyDocument();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    mutate({ file, language });
  };

  const fullText =
    data &&
    [data.summary, "", data.eli10, "", ...(data.keyPoints || [])].join("\n");

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Document Simplifier</h1>
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
            />
          </label>
          <label className="text-sm font-medium">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input mt-1"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </label>
        </div>
        <button className="btn-primary w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Processing…" : "Simplify"}
        </button>
      </form>

      {data && (
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Summary</h2>
            <VoiceBar textToSpeak={fullText || ""} />
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
    </main>
  );
}

