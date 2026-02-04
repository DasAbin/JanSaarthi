"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listModules } from "../app/api/client";
import { useLearnModule } from "../hooks/useLearnModule";
import { VoiceBar } from "../components/VoiceBar";

const FALLBACK_MODULES = [{ id: "financial_basics", title: "Financial Basics" }];

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

export default function LearnModules() {
    const defaultLang = typeof navigator !== "undefined" ? getLocalLanguage() : "en";
    const { data: modulesData, isError: modulesError, isLoading: modulesLoading } = useQuery({
        queryKey: ["learn-modules"],
        queryFn: async () => {
            const res = await listModules();
            return res.data;
        }
    });
    const modules = modulesData?.modules ?? FALLBACK_MODULES;
    const [selected, setSelected] = useState<string>(FALLBACK_MODULES[0].id);

    useEffect(() => {
        if (modules.length > 0 && !modules.some((m: any) => m.id === selected)) {
            setSelected(modules[0].id);
        }
    }, [modules, selected]);

    const { data, isLoading, isError, refetch } = useLearnModule(selected);

    const onChange = (id: string) => {
        setSelected(id);
        setTimeout(() => refetch(), 0);
    };

    return (
        <div className="space-y-6" role="region" aria-label="Learn and Grow">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Learn &amp; Grow</h2>
                <p className="text-slate-600">Short lessons on money, rights, and digital safety.</p>
            </div>

            {modulesLoading && <p className="text-sm text-slate-600 text-center">Loading modules…</p>}
            {modulesError && (
                <p className="text-sm text-red-600 text-center" role="alert">
                    Failed to load modules. Check your connection.
                </p>
            )}

            <div className="flex justify-center">
                <div className="flex gap-2 overflow-x-auto pb-4 max-w-full no-scrollbar px-2" aria-label="Module list">
                    {modules.map((m: any) => (
                        <button
                            key={m.id}
                            onClick={() => onChange(m.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selected === m.id
                                ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-2"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {m.title}
                        </button>
                    ))}
                </div>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[300px]" aria-label="Module content">
                {isLoading && (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-sm text-slate-500 animate-pulse">Loading content...</p>
                    </div>
                )}
                {isError && (
                    <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-600" role="alert">Failed to load this module. Try again.</p>
                    </div>
                )}
                {data && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
                                <p className="text-sm text-slate-600 mt-1">{data.description}</p>
                            </div>
                            <VoiceBar textToSpeak={data.description} defaultLang={defaultLang} />
                        </div>

                        <div className="space-y-8">
                            {data.lessons?.map((lesson: any, idx: number) => (
                                <article key={idx} className="bg-slate-50 rounded-lg p-5 border border-slate-100/50">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-slate-900">{lesson.title}</h3>
                                        <VoiceBar textToSpeak={lesson.content} defaultLang={defaultLang} />
                                    </div>
                                    <p className="text-base text-slate-700 leading-relaxed">{lesson.content}</p>

                                    {lesson.quiz && lesson.quiz.length > 0 && (
                                        <div className="mt-4 bg-white rounded-lg p-4 border border-indigo-100">
                                            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Quick Quiz</p>
                                            <ul className="space-y-3">
                                                {lesson.quiz.map((q: any, qIdx: number) => (
                                                    <li key={qIdx} className="text-sm">
                                                        <p className="font-medium text-slate-900 mb-1">
                                                            {q.question}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                            {q.options.map((opt: string, i: number) => (
                                                                <span key={i} className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                                    {opt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
