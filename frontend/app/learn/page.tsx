"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listModules } from "../api/client";
import { useLearnModule } from "../../hooks/useLearnModule";
import { VoiceBar } from "../../components/VoiceBar";

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

export default function LearnPage() {
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
    if (modules.length > 0 && !modules.some((m) => m.id === selected)) {
      setSelected(modules[0].id);
    }
  }, [modules, selected]);

  const { data, isLoading, isError, refetch } = useLearnModule(selected);

  const onChange = (id: string) => {
    setSelected(id);
    setTimeout(() => refetch(), 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4" role="main" aria-label="Learn and Grow">
      <h1 className="text-xl font-semibold">Learn &amp; Grow</h1>
      <p className="text-sm text-slate-600">
        Short lessons on money, rights, and digital safety. Listen in your language.
      </p>

      {modulesLoading && <p className="text-sm text-slate-600">Loading modules…</p>}
      {modulesError && (
        <p className="text-sm text-red-600" role="alert">
          Failed to load modules. Check your connection.
        </p>
      )}

      <section className="card p-4 flex gap-3 overflow-x-auto" aria-label="Module list">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${selected === m.id
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-800"
              }`}
          >
            {m.title}
          </button>
        ))}
      </section>

      <section className="card p-4 space-y-3" aria-label="Module content">
        {isLoading && <p className="text-sm text-slate-600" aria-live="polite">Loading module…</p>}
        {isError && (
          <p className="text-sm text-red-600" role="alert">
            Failed to load this module. Try again.
          </p>
        )}
        {data && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{data.title}</h2>
                <p className="text-sm text-slate-700">{data.description}</p>
              </div>
              <VoiceBar textToSpeak={data.description} defaultLang={defaultLang} />
            </div>
            <div className="space-y-4 mt-3">
              {data.lessons?.map((lesson: any, idx: number) => (
                <article key={idx} className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{lesson.title}</h3>
                    <VoiceBar textToSpeak={lesson.content} defaultLang={defaultLang} />
                  </div>
                  <p className="text-sm text-slate-700">{lesson.content}</p>
                  {lesson.quiz && lesson.quiz.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold">Quick quiz</p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {lesson.quiz.map((q: any, qIdx: number) => (
                          <li key={qIdx}>
                            <span className="font-medium">
                              {q.question}{" "}
                            </span>
                            <span className="block text-slate-700">
                              {q.options.join(" / ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

