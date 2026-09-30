"use client";

import { useCallback, useEffect, useState } from "react";
import type { Analysis, AskResult, VerifyResult } from "@/canary/types";
import { CanaryApp, type Account, type Gap, type Resolution } from "./ui/CanaryApp";

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

// Connects the UI to the API. All permission checks happen on the server; the UI only mirrors them.
export default function CanaryLive({ publicStats }: { publicStats: { docs: number; claims: number; issues: number } }) {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [personas, setPersonas] = useState<Account[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);

  const refresh = useCallback(async () => {
    const res = await api<{ analysis: Analysis; resolutions: Resolution[]; gaps: Gap[] }>("/api/analysis");
    if (!res.ok) return;
    setAnalysis(res.data.analysis);
    setResolutions(res.data.resolutions);
    setGaps(res.data.gaps);
  }, []);

  useEffect(() => {
    api<{ user: Account | null; personas: Account[] }>("/api/me").then((res) => {
      setPersonas(res.data.personas ?? []);
      setUser(res.data.user ?? null);
      setLoaded(true);
      if (res.data.user) refresh();
    });
  }, [refresh]);

  async function onLogin(userId: string, password: string): Promise<string | null> {
    const res = await api<{ user?: Account; error?: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ user: userId, password }) });
    if (!res.ok || !res.data.user) return res.data.error ?? "Sign-in failed";
    setUser(res.data.user);
    refresh();
    return null;
  }

  async function onLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAnalysis(null);
  }

  async function onAsk(question: string): Promise<AskResult> {
    const res = await api<AskResult & { error?: string }>("/api/ask", { method: "POST", body: JSON.stringify({ question }) });
    if (!res.ok) throw new Error(res.data.error ?? "Something went wrong");
    if (res.data.status === "no_source") refresh();
    return res.data;
  }

  async function onVerify(draft: string): Promise<VerifyResult> {
    const res = await api<VerifyResult & { error?: string }>("/api/verify", { method: "POST", body: JSON.stringify({ draft }) });
    if (!res.ok) throw new Error(res.data.error ?? "Something went wrong");
    return res.data;
  }

  async function onResolve(issueId: string, action: "approve" | "dismiss"): Promise<string | null> {
    const res = await api<{ resolution?: Resolution; error?: string }>("/api/issues/resolve", { method: "POST", body: JSON.stringify({ issue_id: issueId, action }) });
    if (!res.ok || !res.data.resolution) return res.data.error ?? `Refused (${res.status})`;
    const resolution = res.data.resolution;
    setResolutions((prev) => [...prev.filter((r) => r.issue_id !== issueId), resolution]);
    return null;
  }

  async function onRescan(): Promise<string | null> {
    const res = await api<{ error?: string }>("/api/scan", { method: "POST" });
    if (!res.ok) return res.data.error ?? "Scan failed";
    await refresh();
    return null;
  }

  if (!loaded) return <main className="min-h-screen bg-navy" />;
  return (
    <CanaryApp
      user={user}
      personas={personas}
      publicStats={publicStats}
      analysis={analysis}
      resolutions={resolutions}
      gaps={gaps}
      onLogin={onLogin}
      onLogout={onLogout}
      onAsk={onAsk}
      onVerify={onVerify}
      onResolve={onResolve}
      onRescan={onRescan}
    />
  );
}
