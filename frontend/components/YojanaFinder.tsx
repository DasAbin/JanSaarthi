"use client";

import { useState } from "react";
import { useYojanaMatch } from "../hooks/useYojanaMatch";

export default function YojanaFinder() {
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
        <div className="space-y-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Find Schemes For You</h2>
                <p className="text-slate-600">Enter your details to find government schemes you are eligible for.</p>
            </div>

            <form
                onSubmit={onSubmit}
                className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl shadow-sm border border-slate-200"
            >
                <label className="text-sm font-medium text-slate-700">
                    Age
                    <input
                        type="number"
                        className="input mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 25"
                    />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Monthly Income (₹)
                    <input
                        type="number"
                        className="input mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="e.g. 15000"
                    />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    State
                    <input
                        type="text"
                        className="input mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                    />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Occupation
                    <input
                        type="text"
                        className="input mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Farmer"
                    />
                </label>
                <div className="sm:col-span-2 flex justify-end mt-4">
                    <button
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isPending}
                    >
                        {isPending ? "Checking..." : "Check Schemes"}
                    </button>
                </div>
            </form>

            {isError && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                        {error instanceof Error ? (
                            (error as any).response?.data?.error || error.message
                        ) : (
                            "Failed to check schemes"
                        )}
                    </p>
                </div>
            )}

            {data?.results && (
                <section className="space-y-4 mt-8">
                    <h3 className="text-lg font-semibold text-slate-900">Matches Found</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.results.map((item: any) => (
                            <article key={item.scheme.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-bold text-slate-900 line-clamp-1" title={item.scheme.name}>{item.scheme.name}</h2>
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        {typeof item.score === "number" ? item.score : 0}% Match
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                                    {item.scheme.description}
                                </p>
                                <div className="mt-auto space-y-2">
                                    <p className="text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">Why:</span>{" "}
                                        {Array.isArray(item.reasons) ? item.reasons.join(" ") : ""}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">Benefit: </span>
                                        {item.scheme.benefit}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
