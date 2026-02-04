"use client";

import { useState } from "react";
import { useYojanaMatch } from "../../hooks/useYojanaMatch";

export default function YojanaPage() {
  const [age, setAge] = useState<string>("");
  const [income, setIncome] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const { mutate, data, isPending, isError, error } = useYojanaMatch();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      age: age ? Number(age) : undefined,
      income: income ? Number(income) : undefined,
      state,
      occupation
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <h1 className="text-xl font-semibold">YojanaMatch</h1>
      <form
        onSubmit={onSubmit}
        className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <label className="text-sm font-medium">
          Age
          <input
            type="number"
            className="input mt-1"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Monthly Income (₹)
          <input
            type="number"
            className="input mt-1"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          State
          <input
            type="text"
            className="input mt-1"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Occupation
          <input
            type="text"
            className="input mt-1"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
        </label>
        <div className="sm:col-span-2 flex justify-end">
          <button className="btn-primary" disabled={isPending}>
            {isPending ? "Checking…" : "Check Schemes"}
          </button>
        </div>
      </form>

      {isError && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Failed to check schemes"}
        </p>
      )}

      {data?.results && (
        <section className="space-y-3">
          {data.results.map((item: any) => (
            <article key={item.scheme.id} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{item.scheme.name}</h2>
                <span className="text-xs text-slate-500">
                  Match: {typeof item.score === "number" ? item.score : 0}%
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {item.scheme.description}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Why:</span>{" "}
                {Array.isArray(item.reasons) ? item.reasons.join(" ") : ""}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Benefit: </span>
                {item.scheme.benefit}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

