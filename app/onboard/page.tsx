"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function OnboardPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth"); return; }

    const res = await fetch(`${API_URL}/carriers/onboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: companyName }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.detail ?? "Failed to create account.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Almost there</h1>
        <p className="mb-8 text-center text-sm text-slate-500">What's your company name?</p>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Company name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Logistics"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Setting up…" : "Get started"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
