"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSchemes, compareSchemes } from "../app/api/client";
import { GitCompare } from "lucide-react";

export default function SchemeComparison() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: schemesData } = useQuery({
    queryKey: ["schemes-list"],
    queryFn: async () => {
      const res = await listSchemes();
      return res.data;
    }
  });
  const schemes = schemesData?.schemes ?? [];

  const { data: compareData, isLoading } = useQuery({
    queryKey: ["schemes-compare", selectedIds],
    queryFn: async () => {
      const res = await compareSchemes(selectedIds);
      return res.data;
    },
    enabled: selectedIds.length >= 2
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-4" role="region" aria-label="Scheme Comparison">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 mb-3">
          <GitCompare size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Compare Schemes</h2>
        <p className="text-slate-600 text-sm">
          Select 2–5 schemes to compare benefits, eligibility, and documents side by side.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {schemes.map((s: { id: string; name: string; category?: string }) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedIds.includes(s.id)
                ? "bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {selectedIds.length < 2 && (
        <p className="text-sm text-slate-500 text-center py-8">
          Select at least 2 schemes to compare.
        </p>
      )}

      {isLoading && selectedIds.length >= 2 && (
        <div className="text-center py-8 text-slate-500 animate-pulse">Loading comparison…</div>
      )}

      {compareData?.schemes && compareData.schemes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-left font-semibold text-slate-900 w-32">Aspect</th>
                {compareData.schemes.map((s: { name?: string }) => (
                  <th key={s.name} className="py-3 px-4 text-left font-semibold text-slate-900 min-w-[200px]">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium text-slate-700">Description</td>
                {compareData.schemes.map((s: { description?: string }, i: number) => (
                  <td key={i} className="py-2 px-4 text-slate-600">{s.description}</td>
                ))}
              </tr>
              <tr className="border-t bg-slate-50/50">
                <td className="py-2 px-4 font-medium text-slate-700">Benefit</td>
                {compareData.schemes.map((s: { benefit?: string }, i: number) => (
                  <td key={i} className="py-2 px-4 text-slate-600">{s.benefit}</td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium text-slate-700">Eligibility</td>
                {compareData.schemes.map((s: { eligibility_rules?: string[] }, i: number) => (
                  <td key={i} className="py-2 px-4 text-slate-600">
                    <ul className="list-disc pl-4 space-y-1">
                      {(s.eligibility_rules || []).map((r: string, j: number) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="border-t bg-slate-50/50">
                <td className="py-2 px-4 font-medium text-slate-700">Documents</td>
                {compareData.schemes.map((s: { documents_required?: string[] }, i: number) => (
                  <td key={i} className="py-2 px-4 text-slate-600">
                    <ul className="list-disc pl-4 space-y-1">
                      {(s.documents_required || []).map((d: string, j: number) => (
                        <li key={j}>{d}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4 font-medium text-slate-700">Steps</td>
                {compareData.schemes.map((s: { steps?: string[] }, i: number) => (
                  <td key={i} className="py-2 px-4 text-slate-600">
                    <ol className="list-decimal pl-4 space-y-1">
                      {(s.steps || []).map((st: string, j: number) => (
                        <li key={j}>{st}</li>
                      ))}
                    </ol>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
