"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchIntelligenceFeed, type TourRisk, type StopRisk } from "@/lib/api";

export default function IntelligencePage() {
  const [feed, setFeed] = useState<TourRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIntelligenceFeed()
      .then(setFeed)
      .catch(() => setError("Could not load intelligence feed."))
      .finally(() => setLoading(false));
  }, []);

  const high = feed.filter((t) => t.risk_level === "high");
  const medium = feed.filter((t) => t.risk_level === "medium");
  const low = feed.filter((t) => t.risk_level === "low");

  if (loading) return <div className="min-h-screen bg-slate-50 p-8"><p className="text-slate-400">Loading…</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Intelligence</h1>
            <p className="mt-1 text-sm text-slate-500">Tours scored against historical patterns</p>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← Plans</Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {feed.length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No intelligence yet.</p>
            <p className="mt-1 text-sm text-slate-400">Upload a plan — it will be scored automatically against your historical patterns.</p>
          </div>
        )}

        {high.length > 0 && (
          <FeedSection title="High risk" color="red" tours={high} />
        )}
        {medium.length > 0 && (
          <FeedSection title="Medium risk" color="amber" tours={medium} />
        )}
        {low.length > 0 && (
          <FeedSection title="Low risk" color="green" tours={low} />
        )}
      </div>
    </main>
  );
}

function FeedSection({ title, color, tours }: { title: string; color: "red" | "amber" | "green"; tours: TourRisk[] }) {
  const colors = {
    red:   { dot: "bg-red-500",    heading: "text-red-700" },
    amber: { dot: "bg-amber-400",  heading: "text-amber-700" },
    green: { dot: "bg-emerald-500", heading: "text-emerald-700" },
  };
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${colors[color].dot}`} />
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${colors[color].heading}`}>{title}</h2>
        <span className="text-xs text-slate-400">({tours.length})</span>
      </div>
      <div className="space-y-4">
        {tours.map((t) => <TourRiskCard key={t.tour_risk_id} tour={t} />)}
      </div>
    </section>
  );
}

function TourRiskCard({ tour }: { tour: TourRisk }) {
  const [expanded, setExpanded] = useState(tour.risk_level === "high");

  const levelStyles = {
    high:   "border-red-200 bg-red-50",
    medium: "border-amber-200 bg-amber-50",
    low:    "border-slate-200 bg-white",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${levelStyles[tour.risk_level]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">Tour {tour.external_tour_id}</h3>
            <span className="text-xs text-slate-400">{tour.plan_filename}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {tour.estimated_delay_minutes > 0 && (
              <span className="text-red-700">+{tour.estimated_delay_minutes} min delay</span>
            )}
            {tour.estimated_revenue_loss_eur > 0 && (
              <span className="text-red-700">€{tour.estimated_revenue_loss_eur.toFixed(0)} at risk</span>
            )}
            {tour.estimated_co2_kg > 0 && (
              <span className="text-slate-500">{tour.estimated_co2_kg.toFixed(1)} kg CO₂</span>
            )}
            {tour.flagged_stops > 0 && (
              <span className="text-slate-500">{tour.flagged_stops} flagged {tour.flagged_stops === 1 ? "stop" : "stops"}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 text-xs text-slate-400 hover:text-slate-700"
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>

      {expanded && tour.stop_risks.length > 0 && (
        <div className="mt-4 space-y-2">
          {tour.stop_risks.filter(s => s.risk_score > 0).map((sr) => (
            <StopRiskRow key={sr.location_name} stop={sr} />
          ))}
        </div>
      )}
    </div>
  );
}

function StopRiskRow({ stop }: { stop: StopRisk }) {
  const high = stop.risk_score >= 0.5;
  const med  = stop.risk_score >= 0.2;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${high ? "border-red-200 bg-white" : med ? "border-amber-100 bg-white" : "border-slate-100 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">{stop.location_name}</p>
          <p className="mt-0.5 text-slate-500">{stop.recommended_action}</p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-400 space-y-0.5">
          {stop.avg_historical_delay_minutes != null && (
            <p>avg {stop.avg_historical_delay_minutes > 0 ? `+${stop.avg_historical_delay_minutes}` : stop.avg_historical_delay_minutes} min</p>
          )}
          {stop.historical_failure_rate != null && stop.historical_failure_rate > 0 && (
            <p>{(stop.historical_failure_rate * 100).toFixed(0)}% failure</p>
          )}
          <p>{stop.historical_sample_count} runs</p>
        </div>
      </div>
    </div>
  );
}
