"use client";

import { useState } from "react";
import { useYojanaMatch } from "../../hooks/useYojanaMatch";

export default function YojanaPage() {
  const [age, setAge] = useState<string>("");
  const [income, setIncome] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const { mutate, data, isPending } = useYojanaMatch();

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
    <main className="space-y-4">
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

      {data && (
        <section className="space-y-3">
          {data.map((item: any) => (
            <article key={item.scheme.id} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{item.scheme.name}</h2>
                <span className="text-xs text-slate-500">
                  Match: {(item.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {item.scheme.description}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Why:</span> {item.explanation}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Benefit: </span>
                {item.scheme.benefit}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

