"use client";

import React from 'react';
import Link from 'next/link';
import {
  Mic,
  Search,
  MessageSquare,
  ShieldCheck,
  Languages,
  FileText,
  ArrowRight
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

const App = () => {
  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                <span className="mr-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>
                Now supporting 12+ regional languages
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                Navigating Governance, <br />
                <span className="text-indigo-600">Simplified for Everyone.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600 sm:max-w-xl sm:mx-auto lg:mx-0">
                JanSaarthi is your AI-powered companion for civic services.
                Bridge the gap between technology and bureaucracy with simple voice commands and personalized guidance.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                {/* Primary CTA: High contrast and accessible */}
                <Link
                  href="/yojana"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 sm:w-auto"
                >
                  <Search size={24} />
                  Find Schemes
                </Link>

                {/* Secondary CTA: Clean outline style */}
                <Link
                  href="/simplify"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
                >
                  Simplify Docs
                  <ArrowRight size={20} />
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 grayscale opacity-60 lg:justify-start">
                <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Trusted By</span>
                {/* Mock Partners/Depts */}
                <div className="h-6 w-24 bg-slate-300 rounded"></div>
                <div className="h-6 w-24 bg-slate-300 rounded"></div>
              </div>
            </div>

            {/* Hero Visual - Modern glassmorphism card stack */}
            <div className="hidden lg:relative lg:block">
              <div className="relative mx-auto w-full max-w-[500px]">
                <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-indigo-100 opacity-50 blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>

                <div className="relative rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Languages size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Translate Document</p>
                        <p className="text-xs text-slate-500">English to Hindi • Success</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Eligibility Check</p>
                        <p className="text-xs text-slate-500">PM-Kisan Scheme • Eligible</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl bg-indigo-600 p-4 text-white shadow-md">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Mic size={20} />
                      </div>
                      <p className="text-sm font-medium italic">"How can I apply for a new ration card?"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-600">Solutions</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              One app. Every civic need.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Designed to be used by anyone, regardless of their technical literacy or language proficiency.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Mic className="text-indigo-600" />}
              title="Voice Navigation"
              description="Skip the menus. Just speak in your native tongue to find what you need instantly."
              color="bg-indigo-50"
              href="#"
            />
            <FeatureCard
              icon={<Search className="text-blue-600" />}
              title="Scheme Discovery"
              description="Automated eligibility checks for state and central government welfare programs."
              color="bg-blue-50"
              href="/yojana"
            />
            <FeatureCard
              icon={<MessageSquare className="text-emerald-600" />}
              title="Direct Support"
              description="Connect directly with grievance redressal cells without visiting an office."
              color="bg-emerald-50"
              href="#"
            />
            <FeatureCard
              icon={<FileText className="text-amber-600" />}
              title="Simplified Docs"
              description="AI summaries of complex government notifications in plain, simple language."
              color="bg-amber-50"
              href="/simplify"
            />
          </div>
        </div>
      </section>

      {/* Trust/Social Proof Section */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-indigo-900 px-6 py-12 shadow-xl sm:px-12 lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-0 lg:flex-1">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to experience better governance?
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-indigo-100">
                Join 10,000+ citizens using JanSaarthi to access their rights and entitlements every day.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:ml-8">
              <button className="flex w-full items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-900 transition-all hover:bg-indigo-50 sm:w-auto">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
