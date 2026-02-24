"use client";

import { useState } from "react";
import { useFormHelper } from "../hooks/useFormHelper";
import { VoiceBar } from "./VoiceBar";
import { VOICE_LANGUAGES } from "../hooks/useVoice";
import { FileText } from "lucide-react";

function getLocalLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "";
  if (lang.startsWith("hi")) return "hi";
  if (lang.startsWith("mr")) return "mr";
  return "en";
}

export default function FormHelperInline() {
  const [image, setImage] = useState<File | null>(null);
  const [language, setLanguage] = useState(() => (typeof navigator !== "undefined" ? getLocalLanguage() : "en"));
  const { mutate, data, isPending, isError, error } = useFormHelper();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    mutate({ image, language });
  };

  const handleDownload = () => {
    if (!data) return;
    const lines = [
      `Form: ${data.title || "Government Form"}`,
      data.description || "",
      "",
      "--- Fields ---",
      ...(data.fields || []).map(
        (f: { field?: string; meaning?: string; example?: string; required?: boolean }) =>
          `${f.field}: ${f.meaning} | Example: ${f.example} | Required: ${f.required ? "Yes" : "No"}`
      ),
      "",
      "--- Tips ---",
      ...(data.tips || [])
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-guide.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" role="region" aria-label="AI Form Helper">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 mb-3">
          <FileText size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">AI Form Helper</h2>
        <p className="text-slate-600 text-sm">
          Upload a form photo to get simple explanations in your language.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex-1 space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Upload Form Photo</span>
            <input
              type="file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700"
              accept="image/*"
            />
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="block w-full rounded-md border-slate-300 text-sm py-2"
            aria-label="Explanation language"
          >
            {VOICE_LANGUAGES.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending || !image}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Analyzing…" : "Explain Form"}
        </button>
      </form>

      {isError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700" role="alert">
            {(error as Error)?.message || "Failed to analyze form. Try again."}
          </p>
        </div>
      )}

      {data && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{data.title}</h3>
              <p className="text-sm text-slate-600">{data.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <VoiceBar
                textToSpeak={data.fields?.map((f: { field?: string; meaning?: string }) => `${f.field}: ${f.meaning}`).join(". ") || ""}
                defaultLang={language}
              />
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download Guide
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                {data.fields?.map((f: { field?: string; meaning?: string; example?: string; required?: boolean }, idx: number) => (
                  <tr key={idx} className={f.required ? "bg-amber-50/50 border-b" : "border-b"}>
                    <td className="py-2 pr-3 font-medium">{f.field}</td>
                    <td className="py-2 pr-3">{f.meaning}</td>
                    <td className="py-2 pr-3 text-slate-600">{f.example}</td>
                    <td className="py-2 pr-3">
                      {f.required ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">Required</span>
                      ) : (
                        <span className="text-xs text-slate-500">Optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.tips && data.tips.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-2">Tips</h4>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {data.tips.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
