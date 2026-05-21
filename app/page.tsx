"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchPlans, uploadPlan, type PlanSummary } from "@/lib/api";

export default function Home() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPlans() {
    try {
      setPlans(await fetchPlans());
    } catch {
      setError("Could not load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadPlan(file);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">FREITIR</h1>
            <p className="mt-1 text-slate-500">Transport execution intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/intelligence" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Intelligence
            </Link>
            <Link href="/analytics" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Performance
            </Link>
          <label className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors ${uploading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-700"}`}>
            {uploading ? "Uploading…" : "Upload Plan"}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="text-slate-400">Loading plans…</p>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No plans yet. Upload a CSV or Excel file to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`}>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.filename}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {plan.tour_count} {plan.tour_count === 1 ? "tour" : "tours"} · {new Date(plan.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {plan.has_execution ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">Execution data</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">No execution yet</span>
                    )}
                    <span className="text-slate-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
