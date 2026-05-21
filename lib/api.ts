import { createClient } from "@/lib/supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export type PlanSummary = {
  id: string;
  filename: string;
  uploaded_at: string;
  plan_date: string | null;
  tour_count: number;
  has_execution: boolean;
};

export type WeeklyTrend = {
  plan_date: string;
  tours_run: number;
  total_delay_minutes: number;
  failed_stops: number;
  total_stops: number;
  revenue_lost_eur: number;
};

export type StopGap = {
  arrival_delta_minutes: number | null;
  departure_delta_minutes: number | null;
  is_failed: boolean;
};

export type StopWithGap = {
  db_stop_id: string;
  sequence: number;
  location_name: string;
  planned_arrival: string | null;
  planned_departure: string | null;
  gap: StopGap | null;
};

export type TourGap = {
  total_delay_minutes: number;
  failed_stops: number;
  total_stops: number;
};

export type TourWithGaps = {
  db_tour_id: string;
  external_tour_id: string;
  gap: TourGap | null;
  stops: StopWithGap[];
};

export type PlanWithGaps = {
  plan_id: string;
  filename: string;
  uploaded_at: string;
  tours: TourWithGaps[];
};

export async function fetchPlans(): Promise<PlanSummary[]> {
  const res = await fetch(`${API_URL}/plans`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
}

export async function fetchPlanGaps(planId: string): Promise<PlanWithGaps> {
  const res = await fetch(`${API_URL}/plans/${planId}/gaps`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch plan gaps");
  return res.json();
}

export async function uploadPlan(file: File, planDate?: string): Promise<{ db_plan_id: string }> {
  const form = new FormData();
  form.append("file", file);
  if (planDate) form.append("plan_date", planDate);
  const res = await fetch(`${API_URL}/plans/canonical`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

export async function fetchWeeklyTrends(): Promise<WeeklyTrend[]> {
  const res = await fetch(`${API_URL}/analytics/weekly`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch weekly trends");
  return res.json();
}

export type AnalyticsSummary = {
  total_delay_minutes: number;
  revenue_lost_eur: number;
  co2_kg: number;
  tours_analyzed: number;
  plans_analyzed: number;
  total_failed_stops: number;
  total_stops: number;
  worst_locations: Pattern[];
};

export type Pattern = {
  location_name: string;
  avg_arrival_delta_minutes: number | null;
  failure_rate: number | null;
  sample_count: number;
};

export type StopRisk = {
  location_name: string;
  risk_score: number;
  avg_historical_delay_minutes: number | null;
  historical_failure_rate: number | null;
  historical_sample_count: number;
  recommended_action: string;
};

export type TourRisk = {
  tour_risk_id: string;
  plan_id: string;
  plan_filename: string;
  external_tour_id: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  estimated_delay_minutes: number;
  estimated_revenue_loss_eur: number;
  estimated_co2_kg: number;
  flagged_stops: number;
  computed_at: string;
  stop_risks: StopRisk[];
};

export async function fetchIntelligenceFeed(): Promise<TourRisk[]> {
  const res = await fetch(`${API_URL}/intelligence/feed`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch intelligence feed");
  return res.json();
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_URL}/analytics/summary`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchPatterns(): Promise<Pattern[]> {
  const res = await fetch(`${API_URL}/analytics/patterns`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch patterns");
  return res.json();
}

export type SimulatorResult = {
  plan_id: string;
  scenario: string;
  events_generated: number;
  stop_gaps_computed: number;
  tour_gaps_computed: number;
};

export async function runSimulation(
  planId: string,
  scenario: "on_time" | "delayed" | "disrupted",
): Promise<SimulatorResult> {
  const res = await fetch(`${API_URL}/simulator/run`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ plan_id: planId, scenario }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Simulation failed");
  }
  return res.json();
}

export async function uploadExecution(planId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/execution/upload?plan_id=${planId}`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}
