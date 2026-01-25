"use client";

import { useState } from "react";
import { useLearnModule } from "../../hooks/useLearnModule";
import { VoiceBar } from "../../components/VoiceBar";

const MODULES = [{ id: "financial_basics", title: "Financial Basics" }];

export default function LearnPage() {
  const [selected, setSelected] = useState<string>("financial_basics");
  const { data, isLoading, refetch } = useLearnModule(selected);

  const onChange = (id: string) => {
    setSelected(id);
    setTimeout(() => refetch(), 0);
  };

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Learn &amp; Grow</h1>

      <section className="card p-4 flex gap-3 overflow-x-auto">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selected === m.id
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            {m.title}
          </button>
        ))}
      </section>

      <section className="card p-4 space-y-3">
        {isLoading && <p className="text-sm">Loading module…</p>}
        {data && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{data.title}</h2>
                <p className="text-sm text-slate-700">{data.description}</p>
              </div>
              <VoiceBar textToSpeak={data.description} />
            </div>
            <div className="space-y-4 mt-3">
              {data.lessons?.map((lesson: any, idx: number) => (
                <article key={idx} className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{lesson.title}</h3>
                    <VoiceBar textToSpeak={lesson.content} />
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
    </main>
  );
}

