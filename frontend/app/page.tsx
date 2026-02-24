"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Search,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GitCompare,
  Upload
} from "lucide-react";
import DocumentSimplifier from "../components/DocumentSimplifier";
import YojanaFinder from "../components/YojanaFinder";
import AskChat from "../components/AskChat";
import FormHelperInline from "../components/FormHelperInline";
import SchemeComparison from "../components/SchemeComparison";
import LearnModules from "../components/LearnModules";

type Section = "simplify" | "yojana" | "ask" | "form" | "compare" | "learn";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { id: "simplify", label: "Simplify Documents", icon: <FileText size={20} />, color: "text-amber-600", bgColor: "bg-amber-100" },
  { id: "yojana", label: "Find Schemes", icon: <Search size={20} />, color: "text-blue-600", bgColor: "bg-blue-100" },
  { id: "ask", label: "Ask JanSaarthi", icon: <MessageSquare size={20} />, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  { id: "form", label: "AI Form Helper", icon: <Upload size={20} />, color: "text-amber-600", bgColor: "bg-amber-100" },
  { id: "compare", label: "Compare Schemes", icon: <GitCompare size={20} />, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { id: "learn", label: "Learn & Grow", icon: <BookOpen size={20} />, color: "text-violet-600", bgColor: "bg-violet-100" }
];

const App = () => {
  const [expanded, setExpanded] = useState<Section | null>("ask");
  const sectionRefs = useRef<Record<Section, HTMLDivElement | null>>({} as Record<Section, HTMLDivElement | null>);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash && SECTIONS.some((s) => s.id === hash)) setExpanded(hash as Section);
  }, []);

  const scrollTo = (id: Section) => {
    setExpanded(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
              <Mic className="mr-2" size={18} />
              Voice-first • 12+ regional languages
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Navigating Governance,{" "}
              <span className="text-indigo-600">Simplified for Everyone.</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
              JanSaarthi is your AI-powered companion for civic services. Simplify documents,
              find schemes, ask questions, and learn—all in your language.
            </p>

            {/* Quick action pills */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
                    expanded === s.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Features - All on one page */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          {SECTIONS.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <div
                key={s.id}
                id={s.id}
                ref={(el) => { (sectionRefs.current as Record<string, HTMLDivElement | null>)[s.id] = el; }}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bgColor} ${s.color}`}>
                      {s.icon}
                    </div>
                    <span className="font-bold text-slate-900">{s.label}</span>
                  </div>
                  {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-6 py-6 bg-slate-50/30">
                    {s.id === "simplify" && <DocumentSimplifier />}
                    {s.id === "yojana" && <YojanaFinder />}
                    {s.id === "ask" && <AskChat />}
                    {s.id === "form" && <FormHelperInline />}
                    {s.id === "compare" && <SchemeComparison />}
                    {s.id === "learn" && <LearnModules />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-indigo-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to experience better governance?
          </h2>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            JanSaarthi helps citizens access government schemes and understand documents in their language.
          </p>
          <button
            onClick={() => scrollTo("ask")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-900 hover:bg-indigo-50 transition-colors"
          >
            <Mic size={20} />
            Ask JanSaarthi
          </button>
        </div>
      </section>
    </div>
  );
};

export default App;
