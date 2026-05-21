"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAnalyticsSummary, fetchPatterns, fetchWeeklyTrends, type AnalyticsSummary, type Pattern, type WeeklyTrend } from "@/lib/api";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [weekly, setWeekly] = useState<WeeklyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, p, w] = await Promise.all([fetchAnalyticsSummary(), fetchPatterns(), fetchWeeklyTrends()]);
        setSummary(s);
        setPatterns(p);
        setWeekly(w);
      } catch {
        setError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 p-8"><p className="text-slate-400">Loading…</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
            <p className="mt-1 text-sm text-slate-500">Rolling 6-week view across all plans</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Plans</Link>
        </div>

        {error && <p className="mb-6 text-sm text-red-600">{error}</p>}

        {summary && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <BigStat label="Revenue lost" value={`€${summary.revenue_lost_eur.toFixed(0)}`} sub={`${summary.total_delay_minutes} min delay`} red={summary.revenue_lost_eur > 0} />
              <BigStat label="CO₂ from idle" value={`${summary.co2_kg.toFixed(1)} kg`} sub="diesel HGV estimate" />
              <BigStat label="Failed stops" value={String(summary.total_failed_stops)} sub={`of ${summary.total_stops} total`} red={summary.total_failed_stops > 0} />
              <BigStat label="Plans analyzed" value={String(summary.plans_analyzed)} sub={`${summary.tours_analyzed} tours`} />
            </div>

            {summary.worst_locations.length > 0 && (
              <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-slate-900">Worst locations</h2>
                <div className="space-y-2">
                  {summary.worst_locations.map((loc) => (
                    <LocationRow key={loc.location_name} pattern={loc} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {weekly.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Week by week</h2>
              <p className="mt-0.5 text-xs text-slate-400">One row per plan date · revenue = delay × €80/hr</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Tours</th>
                  <th className="px-6 py-3">Delay</th>
                  <th className="px-6 py-3">Failed stops</th>
                  <th className="px-6 py-3">Revenue lost</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w) => (
                  <tr key={w.plan_date} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {new Date(w.plan_date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{w.tours_run}</td>
                    <td className="px-6 py-3">
                      <span className={w.total_delay_minutes > 0 ? "font-medium text-red-600" : "text-slate-400"}>
                        {w.total_delay_minutes > 0 ? `+${w.total_delay_minutes}` : w.total_delay_minutes} min
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={w.failed_stops > 0 ? "font-medium text-red-600" : "text-slate-400"}>
                        {w.failed_stops}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={w.revenue_lost_eur > 0 ? "font-medium text-red-600" : "text-slate-400"}>
                        {w.revenue_lost_eur > 0 ? `€${w.revenue_lost_eur.toFixed(0)}` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {patterns.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">All location patterns</h2>
              <p className="mt-0.5 text-xs text-slate-400">Ranked by average arrival delay · 6-week window</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Avg delay</th>
                  <th className="px-6 py-3">Failure rate</th>
                  <th className="px-6 py-3">Samples</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p) => (
                  <tr key={p.location_name} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 font-medium text-slate-900">{p.location_name}</td>
                    <td className="px-6 py-3">
                      <DelayCell delta={p.avg_arrival_delta_minutes} />
                    </td>
                    <td className="px-6 py-3">
                      <FailureCell rate={p.failure_rate} />
                    </td>
                    <td className="px-6 py-3 text-slate-400">{p.sample_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!loading && patterns.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No patterns yet. Upload execution data for a plan to build memory.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function BigStat({ label, value, sub, red = false }: { label: string; value: string; sub: string; red?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${red ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${red ? "text-red-700" : "text-slate-900"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function LocationRow({ pattern }: { pattern: Pattern }) {
  const delta = pattern.avg_arrival_delta_minutes;
  const rate = pattern.failure_rate;
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-900">{pattern.location_name}</span>
      <div className="flex items-center gap-4 text-sm">
        <DelayCell delta={delta} />
        <FailureCell rate={rate} />
        <span className="text-xs text-slate-400">{pattern.sample_count} runs</span>
      </div>
    </div>
  );
}

function DelayCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-slate-300">—</span>;
  const late = delta > 0;
  const early = delta < 0;
  return (
    <span className={`font-medium ${late ? "text-red-600" : early ? "text-emerald-600" : "text-slate-400"}`}>
      {delta > 0 ? `+${delta}` : delta} min
    </span>
  );
}

function FailureCell({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-slate-300">—</span>;
  const pct = (rate * 100).toFixed(0);
  return (
    <span className={`font-medium ${rate > 0 ? "text-red-600" : "text-slate-400"}`}>
      {pct}% failed
    </span>
  );
}
