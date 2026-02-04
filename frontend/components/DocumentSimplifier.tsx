"use client";

import { useState } from "react";
import { useSimplifyDocument } from "../hooks/useSimplifyDocument";
import { VoiceBar } from "../components/VoiceBar";
import { VOICE_LANGUAGES } from "../hooks/useVoice";

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

export default function DocumentSimplifier() {
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
        <div className="space-y-6" role="region" aria-label="Document Simplifier">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Simplify Documents</h2>
                <p className="text-slate-600">Upload a confusing government notice or form, and we'll explain it simply.</p>
            </div>

            <form
                onSubmit={onSubmit}
                className="card p-6 flex flex-col sm:flex-row sm:items-end gap-4 bg-white rounded-xl shadow-sm border border-slate-200"
            >
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Upload PDF or Image
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
                            accept=".pdf,image/*"
                            aria-describedby="upload-hint"
                        />
                        <p id="upload-hint" className="mt-1 text-xs text-slate-500">
                            PDFs and Images up to 10MB.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Output Language
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            aria-label="Document language"
                        >
                            {VOICE_LANGUAGES.map(({ code, name }) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={isPending}
                    aria-busy={isPending}
                >
                    {isPending ? "Simplifying..." : "Simplify Now"}
                </button>
            </form>

            {isError && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700" role="alert">
                        {error instanceof Error ? (
                            (error as any).response?.data?.error || error.message
                        ) : (
                            "Failed to simplify document. Check your connection and try again."
                        )}
                    </p>
                </div>
            )}

            {data && (
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6" aria-label="Summary">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold text-slate-900">Summary</h2>
                        <VoiceBar textToSpeak={fullText || ""} defaultLang={language} />
                    </div>

                    <div>
                        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
                    </div>

                    <div className="bg-indigo-50/50 rounded-lg p-4">
                        <h3 className="text-md font-bold text-indigo-900 mb-2">Explain like I&apos;m 10</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{data.eli10}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-md font-bold text-slate-900 mb-2">Key Points</h3>
                            <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600">
                                {data.keyPoints?.map((p: string, idx: number) => (
                                    <li key={idx}>{p}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-slate-900 mb-2">Steps to Take</h3>
                            <ol className="list-decimal pl-5 text-sm space-y-1 text-slate-600">
                                {data.steps?.map((p: string, idx: number) => (
                                    <li key={idx}>{p}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
