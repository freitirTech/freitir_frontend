"use client";

import { useState } from "react";

type Stop = {
  stop_id: string;
  sequence: number;
  location_name: string;
  planned_arrival: string | null;
  planned_departure: string | null;
};

type Leg = {
  leg_id: string;
  from_stop_id: string;
  to_stop_id: string;
};

type Tour = {
  tour_id: string;
  stops: Stop[];
  legs: Leg[];
};

type CanonicalPlanResponse = {
  plan_id: string;
  filename: string;
  tours: Tour[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [plan, setPlan] = useState<CanonicalPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalStops =
    plan?.tours.reduce((sum, tour) => sum + tour.stops.length, 0) ?? 0;

  const totalLegs =
    plan?.tours.reduce((sum, tour) => sum + tour.legs.length, 0) ?? 0;

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/plans/canonical", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Upload failed.");
      }

      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">FREITIR</h1>
          <p className="mt-2 text-slate-600">
            Upload a transport plan and view its canonical route structure.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload Transport Plan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Supported formats: CSV, XLSX, XLS
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700">
                Select file
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                }}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Parsing..." : "Create Canonical Plan"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        {plan && (
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Plan Summary
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryCard label="Filename" value={plan.filename} />
                <SummaryCard label="Plan ID" value={plan.plan_id} />
                <SummaryCard label="Tours" value={String(plan.tours.length)} />
                <SummaryCard label="Stops / Legs" value={`${totalStops} / ${totalLegs}`} />
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Tour Structure
                </h2>
                <p className="text-sm text-slate-500">
                  Structured for future scoring and route validation
                </p>
              </div>

              <div className="space-y-6">
                {plan.tours.map((tour) => (
                  <TourCard key={tour.tour_id} tour={tour} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Tour {tour.tour_id}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tour.stops.length} stops • {tour.legs.length} legs
          </p>
        </div>

        <div className="flex gap-2">
          <Badge text={`${tour.stops.length} Stops`} />
          <Badge text={`${tour.legs.length} Legs`} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {tour.stops.map((stop, index) => (
          <div key={stop.stop_id}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Stop {stop.sequence}
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {stop.location_name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">{stop.stop_id}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-700">Arrival:</span>{" "}
                    {stop.planned_arrival || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Departure:</span>{" "}
                    {stop.planned_departure || "—"}
                  </div>
                </div>
              </div>
            </div>

            {index < tour.legs.length && (
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
                <div className="h-px flex-1 bg-slate-200" />
                <span>{tour.legs[index].leg_id}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
      {text}
    </span>
  );
}