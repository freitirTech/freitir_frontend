"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { fetchPlanGaps, uploadExecution, type PlanWithGaps, type StopWithGap, type TourWithGaps } from "@/lib/api";

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [plan, setPlan] = useState<PlanWithGaps | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPlan() {
    try {
      setPlan(await fetchPlanGaps(id));
    } catch {
      setError("Could not load plan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlan(); }, [id]);

  async function handleExecutionUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadExecution(id, file);
      await loadPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 p-8"><p className="text-slate-400">Loading…</p></div>;
  if (!plan) return <div className="min-h-screen bg-slate-50 p-8"><p className="text-red-600">{error || "Plan not found."}</p></div>;

  const totalDelay = plan.tours.reduce((s, t) => s + (t.gap?.total_delay_minutes ?? 0), 0);
  const totalFailed = plan.tours.reduce((s, t) => s + (t.gap?.failed_stops ?? 0), 0);
  const hasExecution = plan.tours.some((t) => t.gap !== null);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">Plans</Link>
          <span>/</span>
          <span className="text-slate-900">{plan.filename}</span>
        </div>

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{plan.filename}</h1>
            <p className="mt-1 text-sm text-slate-500">{plan.tours.length} tours · uploaded {new Date(plan.uploaded_at).toLocaleDateString()}</p>
          </div>

          <label className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors ${uploading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-700"}`}>
            {uploading ? "Uploading…" : "Upload Execution"}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleExecutionUpload} disabled={uploading} />
          </label>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        {hasExecution && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Total delay" value={`${totalDelay} min`} highlight={totalDelay > 0} />
            <StatCard label="Failed stops" value={String(totalFailed)} highlight={totalFailed > 0} />
            <StatCard label="Tours" value={String(plan.tours.length)} />
          </div>
        )}

        <div className="space-y-6">
          {plan.tours.map((tour) => <TourCard key={tour.db_tour_id} tour={tour} />)}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function TourCard({ tour }: { tour: TourWithGaps }) {
  const hasGap = tour.gap !== null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tour {tour.external_tour_id}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{tour.stops.length} stops</p>
        </div>
        {hasGap && (
          <div className="flex gap-2">
            {tour.gap!.failed_stops > 0 && <Badge text={`${tour.gap!.failed_stops} failed`} variant="red" />}
            {tour.gap!.total_delay_minutes > 0 && <Badge text={`+${tour.gap!.total_delay_minutes} min`} variant="amber" />}
            {tour.gap!.failed_stops === 0 && tour.gap!.total_delay_minutes === 0 && <Badge text="On time" variant="green" />}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {tour.stops.map((stop, i) => <StopRow key={stop.db_stop_id} stop={stop} isLast={i === tour.stops.length - 1} />)}
      </div>
    </div>
  );
}

function StopRow({ stop, isLast }: { stop: StopWithGap; isLast: boolean }) {
  const gap = stop.gap;
  const failed = gap?.is_failed ?? false;

  return (
    <div>
      <div className={`flex items-start justify-between rounded-xl p-3 ${failed ? "bg-red-50 border border-red-200" : "bg-slate-50"}`}>
        <div>
          <p className="text-xs text-slate-400">Stop {stop.sequence}</p>
          <p className="font-medium text-slate-900">{stop.location_name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {stop.planned_arrival ? `Planned: ${formatTime(stop.planned_arrival)}` : "No planned time"}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-1">
          {gap ? (
            <>
              <DeltaBadge label="Arr" delta={gap.arrival_delta_minutes} />
              <DeltaBadge label="Dep" delta={gap.departure_delta_minutes} />
              {failed && <p className="text-red-600 font-medium">Failed</p>}
            </>
          ) : (
            <p className="text-slate-300">No execution</p>
          )}
        </div>
      </div>
      {!isLast && <div className="ml-4 h-2 w-px bg-slate-200" />}
    </div>
  );
}

function DeltaBadge({ label, delta }: { label: string; delta: number | null }) {
  if (delta === null) return null;
  const late = delta > 0;
  const early = delta < 0;
  return (
    <p className={late ? "text-red-600 font-medium" : early ? "text-emerald-600" : "text-slate-400"}>
      {label}: {delta > 0 ? `+${delta}` : delta} min
    </p>
  );
}

function Badge({ text, variant }: { text: string; variant: "red" | "amber" | "green" | "slate" }) {
  const styles = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}>{text}</span>;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
