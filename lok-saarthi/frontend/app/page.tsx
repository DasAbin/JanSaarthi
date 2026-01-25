import Link from "next/link";
import {
  DocumentTextIcon,
  MicrophoneIcon,
  AcademicCapIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const cards = [
    {
      href: "/upload",
      title: "Document Simplifier",
      description: "Upload a government PDF or photo and get a simple summary.",
      icon: DocumentTextIcon
    },
    {
      href: "/yojana",
      title: "YojanaMatch",
      description:
        "Share your basic details to discover suitable government schemes.",
      icon: SparklesIcon
    },
    {
      href: "/form-helper",
      title: "AI Form Helper",
      description:
        "Take a photo of a form and understand each field in simple words.",
      icon: DocumentTextIcon
    },
    {
      href: "/learn",
      title: "Learn & Grow",
      description: "Short lessons on money, rights, and digital safety.",
      icon: AcademicCapIcon
    }
  ];

  return (
    <main className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
          <MicrophoneIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">LokSaarthi</h1>
          <p className="text-sm text-slate-600">
            Simple, voice-first help for forms, schemes, and learning.
          </p>
        </div>
      </header>

      <section className="card p-4 flex flex-col gap-3">
        <p className="text-sm text-slate-700">
          Speak or type in your language. LokSaarthi explains government
          documents, finds schemes, and teaches essential skills with simple
          words and audio.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card p-4 flex flex-col gap-2 hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <card.icon className="h-7 w-7 text-primary" />
              <h2 className="text-base font-semibold">{card.title}</h2>
            </div>
            <p className="text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

