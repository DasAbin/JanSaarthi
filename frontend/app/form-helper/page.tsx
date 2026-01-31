"use client";

import { useState } from "react";
import { useFormHelper } from "../../hooks/useFormHelper";
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

export default function FormHelperPage() {
  const [image, setImage] = useState<File | null>(null);
  const [language, setLanguage] = useState(() => (typeof navigator !== "undefined" ? getLocalLanguage() : "en"));
  const { mutate, data, isPending, isError, error } = useFormHelper();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    mutate({ image, language });
  };

  return (
    <main className="space-y-4" role="main" aria-label="AI Form Helper">
      <h1 className="text-xl font-semibold">AI Form Helper</h1>
      <p className="text-sm text-slate-600">
        Upload a form photo to get simple explanations in your language. Works with all Indian languages.
      </p>
      <form
        onSubmit={onSubmit}
        className="card p-4 space-y-3 flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">
            Upload Form Photo
            <input
              type="file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm"
              accept="image/*"
              aria-describedby="form-helper-hint"
            />
          </label>
          <p id="form-helper-hint" className="text-xs text-slate-500 sr-only">
            Accepts image files (JPEG, PNG)
          </p>
          <label className="text-sm font-medium block">
            Explanation language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block rounded border border-gray-300 bg-white px-2 py-1 text-sm"
              aria-label="Explanation language"
            >
              {VOICE_LANGUAGES.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn-primary w-full sm:w-auto" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Analyzing…" : "Explain Form"}
        </button>
      </form>

      {isError && (
        <p className="text-sm text-red-600" role="alert">
          {error instanceof Error ? error.message : "Failed to analyze form. Check your connection and try again."}
        </p>
      )}

      {data && (
        <section className="card p-4 overflow-x-auto" aria-label="Form fields explained">
          <VoiceBar textToSpeak={data.fields?.map((f: { field?: string; meaning?: string }) => `${f.field}: ${f.meaning}`).join(". ")} defaultLang={language} />
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Field</th>
                <th className="py-2 pr-3">Meaning</th>
                <th className="py-2 pr-3">Example</th>
                <th className="py-2 pr-3">Required</th>
              </tr>
            </thead>
            <tbody>
              {data.fields?.map((f: any, idx: number) => (
                <tr
                  key={idx}
                  className={
                    f.required ? "bg-blue-50 border-b" : "border-b bg-white"
                  }
                >
                  <td className="py-2 pr-3 font-medium">{f.field}</td>
                  <td className="py-2 pr-3">{f.meaning}</td>
                  <td className="py-2 pr-3 text-slate-600">{f.example}</td>
                  <td className="py-2 pr-3">
                    {f.required ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-primary text-white text-xs">
                        Required
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

