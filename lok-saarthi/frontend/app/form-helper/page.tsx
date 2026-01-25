"use client";

import { useState } from "react";
import { useFormHelper } from "../../hooks/useFormHelper";

export default function FormHelperPage() {
  const [image, setImage] = useState<File | null>(null);
  const { mutate, data, isPending } = useFormHelper();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    mutate({ image });
  };

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">AI Form Helper</h1>
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
            />
          </label>
        </div>
        <button className="btn-primary w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Analyzing…" : "Explain Form"}
        </button>
      </form>

      {data && (
        <section className="card p-4 overflow-x-auto">
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

