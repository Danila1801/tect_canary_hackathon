"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { topicLabel } from "@/lib/topics";
import type { Analysis, AskResult, Claim, Issue, IssueKind } from "@/lib/types";

type Role = "consultant" | "owner" | "admin";
interface Persona {
  id: string;
  name: string;
  team: string;
  role: Role;
}
interface Resolution {
  issue_id: string;
  action: "approved" | "dismissed";
  by: string;
  at: string;
}
interface Gap {
  question: string;
  topic: string;
  routed_to: string | null;
  asked_by: string;
  at: string;
}
type Tab = "ask" | "issues" | "sources" | "experts";

const ROLE_LABEL: Record<Role, string> = { consultant: "Payroll consultant", owner: "Content owner", admin: "Knowledge admin" };

const KIND: Record<IssueKind, { label: string; cls: string }> = {
  outdated_by_law: { label: "Outdated by law", cls: "bg-red-100 text-red-800 ring-red-200" },
  conflict: { label: "Conflict", cls: "bg-orange-100 text-orange-800 ring-orange-200" },
  undocumented: { label: "Only in chats", cls: "bg-sky-100 text-sky-800 ring-sky-200" },
  quarantined: { label: "Quarantined", cls: "bg-zinc-900 text-white ring-zinc-900" },
};

const STATUS: Record<AskResult["status"], { label: string; sub: string; cls: string; dot: string }> = {
  answered: { label: "Verified answer", sub: "Backed by current, official sources", cls: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-500" },
  unverified: { label: "Unverified", sub: "Only informal sources (chats, mails) say this", cls: "border-amber-300 bg-amber-50", dot: "bg-amber-500" },
  conflict: { label: "Sources disagree", sub: "Canary will not pick a side. A human decides", cls: "border-orange-300 bg-orange-50", dot: "bg-orange-500" },
  no_source: { label: "No trusted source", sub: "Nothing written covers this. Logged as a knowledge gap", cls: "border-zinc-300 bg-zinc-50", dot: "bg-zinc-400" },
  blocked: { label: "Blocked", sub: "The question tried to change the assistant's rules", cls: "border-red-300 bg-red-50", dot: "bg-red-600" },
};

const EXAMPLES = [
  "Can our recruiters still ask a candidate what they earn now?",
  "What is the deadline for monthly variable payroll input in Belgium?",
  "An employee lives in Belgium and works 40% in the Netherlands. Which social security applies?",
  "How much is the bike allowance for internal staff?",
];

function trustColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  if (score > 0) return "bg-red-500";
  return "bg-zinc-800";
}

function TrustChip({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-zinc-200">
      <span className={`h-2 w-2 rounded-full ${trustColor(score)}`} />
      trust {score}
    </span>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#F5C518" />
      <path d="M9 18c0-4.4 3.1-8 7.5-8 3.2 0 5.5 1.9 6.3 4.4L26 15l-3.2 1.2C22.3 20 19.5 23 15.5 23 12 23 9 21 9 18z" fill="#111" />
      <circle cx="18.6" cy="14.2" r="1.1" fill="#F5C518" />
    </svg>
  );
}

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

function Login({ personas, onLogin }: { personas: Persona[]; onLogin: (u: Persona) => void }) {
  const [user, setUser] = useState("ann");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await api<{ user?: Persona; error?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ user, password }),
    });
    setBusy(false);
    if (res.ok && res.data.user) onLogin(res.data.user);
    else setError(res.data.error ?? "Sign-in failed");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Logo />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canary</h1>
          <p className="text-sm text-zinc-600">Knowledge that knows when it&apos;s wrong.</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Sign in as</legend>
          <div className="space-y-2">
            {personas.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                  user === p.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                }`}
              >
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-zinc-500">{p.team}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{ROLE_LABEL[p.role]}</span>
                  <input type="radio" name="user" value={p.id} checked={user === p.id} onChange={() => setUser(p.id)} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            maxLength={128}
            required
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-xs text-zinc-500">Demo data is synthetic. Passwords are set per persona in .env.local.</p>
      </form>
    </main>
  );
}

export default function CanaryApp() {
  const [me, setMe] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [tab, setTab] = useState<Tab>("ask");
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);

  const flash = useCallback((text: string, bad = false) => {
    setToast({ text, bad });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const refresh = useCallback(async () => {
    const res = await api<{ analysis: Analysis; resolutions: Resolution[]; gaps: Gap[] }>("/api/analysis");
    if (res.ok) {
      setAnalysis(res.data.analysis);
      setResolutions(res.data.resolutions);
      setGaps(res.data.gaps);
    }
  }, []);

  useEffect(() => {
    api<{ user: Persona | null; personas: Persona[] }>("/api/me").then((res) => {
      setPersonas(res.data.personas ?? []);
      setMe(res.data.user ?? null);
      setLoaded(true);
      if (res.data.user) refresh();
    });
  }, [refresh]);

  function onLogin(u: Persona) {
    setMe(u);
    refresh();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setMe(null);
    setAnalysis(null);
  }

  async function rescan() {
    setScanning(true);
    const res = await api<{ stats?: Analysis["stats"]; error?: string }>("/api/scan", { method: "POST" });
    setScanning(false);
    if (res.ok && res.data.stats) {
      flash(`Scan done: ${res.data.stats.claims} claims from ${res.data.stats.docs} sources in ${res.data.stats.seconds}s`);
      refresh();
    } else flash(res.data.error ?? "Scan failed", true);
  }

  if (!loaded) return <main className="p-8 text-sm text-zinc-500">Loading...</main>;
  if (!me) return <Login personas={personas} onLogin={onLogin} />;

  const s = analysis?.stats;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "ask", label: "Ask" },
    { id: "issues", label: "Detect", count: analysis?.issues.filter((i) => !resolutions.some((r) => r.issue_id === i.id)).length },
    { id: "sources", label: "Trust", count: analysis?.docs.length },
    { id: "experts", label: "Connect" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">Canary</h1>
              <p className="text-xs text-zinc-500">Knowledge that knows when it&apos;s wrong</p>
            </div>
          </div>
          {analysis && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Knowledge health</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {analysis.health}
                  <span className="text-sm text-zinc-400">/100</span>
                </p>
              </div>
              <div className="h-10 w-2 overflow-hidden rounded-full bg-zinc-100">
                <div className={`w-full ${trustColor(analysis.health)}`} style={{ height: `${analysis.health}%`, marginTop: `${100 - analysis.health}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            {me.role === "admin" && (
              <button
                onClick={rescan}
                disabled={scanning}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                {scanning ? "Scanning all sources..." : "Re-scan sources"}
              </button>
            )}
            <div className="text-right">
              <p className="font-medium leading-tight">{me.name}</p>
              <p className="text-xs text-zinc-500">{ROLE_LABEL[me.role]}</p>
            </div>
            <button onClick={logout} className="text-xs text-zinc-500 underline">
              Sign out
            </button>
          </div>
        </div>
        {s && (
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 pb-3 text-xs text-zinc-600">
            <span>
              <b className="text-zinc-900">{s.docs}</b> sources scanned
            </span>
            <span>
              <b className="text-zinc-900">{s.grounded_claims}</b>/{s.claims} claims traced to an exact sentence
            </span>
            <span>
              <b className="text-red-700">{s.outdated}</b> outdated by law
            </span>
            <span>
              <b className="text-orange-700">{s.conflicts}</b> conflicts
            </span>
            <span>
              <b className="text-sky-700">{s.undocumented}</b> only in chats
            </span>
            <span>
              <b>{s.quarantined}</b> quarantined
            </span>
            <span className="text-zinc-400">
              model {analysis?.model.split("/").pop()} · {s.llm_calls} calls · {s.seconds}s
            </span>
          </div>
        )}
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === t.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 text-xs">{t.count}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!analysis ? (
          <p className="text-sm text-zinc-500">Loading analysis...</p>
        ) : tab === "ask" ? (
          <AskPanel analysis={analysis} onGap={refresh} flash={flash} />
        ) : tab === "issues" ? (
          <IssuesPanel
            analysis={analysis}
            resolutions={resolutions}
            me={me}
            flash={flash}
            onResolved={(r) => setResolutions((prev) => [...prev.filter((x) => x.issue_id !== r.issue_id), r])}
          />
        ) : tab === "sources" ? (
          <SourcesPanel analysis={analysis} />
        ) : (
          <ExpertsPanel analysis={analysis} gaps={gaps} />
        )}
      </main>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.bad ? "bg-red-700" : "bg-zinc-900"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function AskPanel({ analysis, onGap, flash }: { analysis: Analysis; onGap: () => void; flash: (t: string, bad?: boolean) => void }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const docTitle = useMemo(() => new Map(analysis.docs.map((d) => [d.id, d])), [analysis]);

  async function submit(q: string) {
    if (q.trim().length < 5) return;
    setQuestion(q);
    setBusy(true);
    setResult(null);
    const res = await api<AskResult & { error?: string }>("/api/ask", { method: "POST", body: JSON.stringify({ question: q }) });
    setBusy(false);
    if (res.ok) {
      setResult(res.data);
      if (res.data.status === "no_source") onGap();
    } else flash(res.data.error ?? "Something went wrong", true);
  }

  const st = result ? STATUS[result.status] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(question);
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={400}
            placeholder="A client is on the phone. What do you need to know?"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-900"
          />
          <button disabled={busy} className="rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Checking..." : "Ask"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              disabled={busy}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:border-zinc-400"
            >
              {ex}
            </button>
          ))}
        </div>

        {busy && (
          <div className="mt-6 animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
            Reading {analysis.stats.grounded_claims} verified claims, checking dates, owners and conflicts...
          </div>
        )}

        {result && st && (
          <article className={`mt-6 rounded-2xl border p-5 ${st.cls}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                <h2 className="font-semibold">{st.label}</h2>
                <span className="text-xs text-zinc-600">{st.sub}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                confidence
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white">
                  <div className="h-full bg-zinc-900" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                </div>
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{result.answer}</p>

            {result.citations.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Why you can rely on it</h3>
                <ul className="mt-2 space-y-2">
                  {result.citations.map((c) => {
                    const d = docTitle.get(c.doc_id);
                    return (
                      <li key={c.doc_id} className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span>
                            <span className="font-mono text-zinc-500">{c.doc_id}</span> · <span className="font-medium">{c.title}</span>
                          </span>
                          <span className="flex items-center gap-2 text-zinc-500">
                            {d?.type} · {d?.owner || "no owner"} · reviewed {d?.last_reviewed}
                            <TrustChip score={c.trust} />
                          </span>
                        </div>
                        <blockquote className="mt-2 border-l-2 border-zinc-300 pl-3 text-sm italic text-zinc-700">&ldquo;{c.quote}&rdquo;</blockquote>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {result.ignored.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What Canary ignored, and why</h3>
                <ul className="mt-2 space-y-1.5">
                  {result.ignored.map((i) => (
                    <li key={i.doc_id} className="text-sm">
                      <span className="font-mono text-xs text-zinc-500">{i.doc_id}</span>{" "}
                      <span className="text-zinc-400 line-through decoration-zinc-400">{docTitle.get(i.doc_id)?.title}</span>
                      <span className="block text-xs text-zinc-600">{i.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.escalate && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Talk to</p>
                  <p>
                    <b>{result.escalate.name}</b> <span className="text-zinc-500">· {result.escalate.team}</span>
                  </p>
                  <p className="text-xs text-zinc-600">{result.escalate.reason}</p>
                </div>
                <button
                  onClick={() => flash(`Handed to ${result.escalate!.name} with the question and sources attached (demo: Teams message in production)`)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Send with context
                </button>
              </div>
            )}
          </article>
        )}
      </section>

      <aside className="space-y-3 text-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold">How Canary answers</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-zinc-600">
            <li>Every source is split into claims. A claim only counts if its quote is found word for word in the source.</li>
            <li>Claims are compared across sources: contradictions, legal changes, missing owners, other countries.</li>
            <li>The model writes the answer. Code checks every citation afterwards and removes anything outdated, quarantined or not in the source.</li>
            <li>No trusted source? It says so and routes you to the person who knows.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-600">
          <h3 className="font-semibold text-zinc-900">Status meanings</h3>
          <ul className="mt-2 space-y-1.5">
            {(Object.keys(STATUS) as AskResult["status"][]).map((k) => (
              <li key={k} className="flex gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS[k].dot}`} />
                <span>
                  <b className="text-zinc-900">{STATUS[k].label}</b>: {STATUS[k].sub}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function IssuesPanel({
  analysis,
  resolutions,
  me,
  flash,
  onResolved,
}: {
  analysis: Analysis;
  resolutions: Resolution[];
  me: Persona;
  flash: (t: string, bad?: boolean) => void;
  onResolved: (r: Resolution) => void;
}) {
  const [filter, setFilter] = useState<IssueKind | "all">("all");
  const claims = useMemo(() => new Map(analysis.claims.map((c) => [c.id, c])), [analysis]);
  const docs = useMemo(() => new Map(analysis.docs.map((d) => [d.id, d])), [analysis]);
  const legal = analysis.docs.find((d) => d.type === "legal-update");
  const lawIssues = analysis.issues.filter((i) => i.kind === "outdated_by_law");
  const lawDocs = new Set(lawIssues.map((i) => i.doc_ids[0]));
  const shown = analysis.issues.filter((i) => filter === "all" || i.kind === filter);

  async function resolve(issue: Issue, action: "approve" | "dismiss") {
    const res = await api<{ resolution?: Resolution; error?: string }>("/api/issues/resolve", {
      method: "POST",
      body: JSON.stringify({ issue_id: issue.id, action }),
    });
    if (res.ok && res.data.resolution) {
      onResolved(res.data.resolution);
      flash(action === "approve" ? `Fix approved by ${me.name}. Canary re-checks the source on the next scan.` : `Issue dismissed by ${me.name}`);
    } else flash(res.data.error ?? `Refused (${res.status})`, true);
  }

  return (
    <div className="space-y-5">
      {legal && lawIssues.length > 0 && (
        <section className="rounded-2xl bg-zinc-900 p-5 text-white">
          <p className="text-xs uppercase tracking-wide text-[#F5C518]">Legal change detected · {legal.id}</p>
          <h2 className="mt-1 text-xl font-semibold">{legal.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            In force since {legal.effective}. Canary traced it through every source: <b className="text-white">{lawIssues.length} statements</b> in{" "}
            <b className="text-white">{lawDocs.size} documents</b> now give the wrong answer. Each one goes to its owner with a suggested rewrite.
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "outdated_by_law", "conflict", "undocumented", "quarantined"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
              filter === k ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200"
            }`}
          >
            {k === "all" ? "All" : KIND[k].label} ({k === "all" ? analysis.issues.length : analysis.issues.filter((i) => i.kind === k).length})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {shown.map((issue) => {
          const res = resolutions.find((r) => r.issue_id === issue.id);
          const canResolve = issue.owner.name === me.name || me.role === "admin";
          const issueClaims = issue.claim_ids.map((id) => claims.get(id)).filter(Boolean) as Claim[];
          return (
            <article key={issue.id} className={`rounded-2xl border border-zinc-200 bg-white p-5 ${res ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${KIND[issue.kind].cls}`}>{KIND[issue.kind].label}</span>
                    {issue.severity === "high" && <span className="text-xs font-medium text-red-700">high impact</span>}
                  </div>
                  <h3 className="mt-2 font-semibold">{issue.title}</h3>
                  <p className="mt-1 max-w-3xl text-sm text-zinc-600">{issue.explanation}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-xs text-zinc-500">Owner</p>
                  <p className="font-medium">{issue.owner.name}</p>
                  <p className="text-xs text-zinc-500">{issue.owner.team}</p>
                </div>
              </div>

              {issueClaims.length > 0 && issue.kind !== "undocumented" && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {issueClaims.slice(0, 2).map((c, idx) => {
                    const d = docs.get(c.doc_id);
                    return (
                      <div key={c.id} className={`rounded-xl p-3 text-sm ring-1 ${idx === 0 ? "bg-red-50/60 ring-red-200" : "bg-emerald-50/60 ring-emerald-200"}`}>
                        <p className="text-xs text-zinc-500">
                          {idx === 0 ? "Says" : "But"} · <span className="font-mono">{c.doc_id}</span> · {d?.type} · reviewed {d?.last_reviewed}
                        </p>
                        <blockquote className="mt-1 italic">&ldquo;{c.quote}&rdquo;</blockquote>
                      </div>
                    );
                  })}
                </div>
              )}

              {issue.kind === "undocumented" && (
                <p className="mt-3 text-sm text-zinc-600">
                  Sources: {issue.doc_ids.map((id) => <span key={id} className="mr-2 font-mono text-xs">{id}</span>)}
                </p>
              )}

              {issue.kind === "quarantined" && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-3 text-xs text-red-300">
                  {analysis.security.find((f) => f.doc_id === issue.doc_ids[0] && f.rule === "override-instructions")?.excerpt ??
                    analysis.security.find((f) => f.doc_id === issue.doc_ids[0])?.excerpt}
                </pre>
              )}

              {(issue.incident_doc_ids.length > 0 || (issue.captured_in?.length ?? 0) > 0) && (
                <div className="mt-3 space-y-1 text-sm">
                  {issue.incident_doc_ids.map((id) => (
                    <p key={id} className="text-red-800">
                      Already caused harm: <span className="font-mono text-xs">{id}</span> · {docs.get(id)?.title}
                    </p>
                  ))}
                  {issue.captured_in?.map((id) => (
                    <p key={id} className="text-emerald-800">
                      The right answer already exists in an inbox: <span className="font-mono text-xs">{id}</span> by {docs.get(id)?.owner}
                    </p>
                  ))}
                </div>
              )}

              {issue.suggested_fix && (
                <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {issue.kind === "undocumented" ? "Draft article from the expert's own answers" : "Suggested rewrite"} · needs human approval
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{issue.suggested_fix}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {res ? (
                  <p className="text-sm font-medium">
                    {res.action === "approved" ? "Approved" : "Dismissed"} by {res.by}
                  </p>
                ) : (
                  <>
                    <button onClick={() => resolve(issue, "approve")} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
                      {issue.kind === "undocumented" ? "Validate and publish" : issue.kind === "quarantined" ? "Confirm quarantine" : issue.kind === "conflict" ? "Resolve conflict" : "Approve fix"}
                    </button>
                    <button onClick={() => resolve(issue, "dismiss")} className="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-zinc-300">
                      {issue.kind === "quarantined" ? "Release source" : "Dismiss"}
                    </button>
                    {!canResolve && <span className="text-xs text-zinc-500">Only {issue.owner.name} or a knowledge admin can approve this.</span>}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SourcesPanel({ analysis }: { analysis: Analysis }) {
  const [open, setOpen] = useState<string | null>(null);
  const trust = new Map(analysis.trust.map((t) => [t.doc_id, t]));
  const rows = [...analysis.docs].sort((a, b) => (trust.get(a.id)?.score ?? 0) - (trust.get(b.id)?.score ?? 0));
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <p className="border-b border-zinc-100 px-4 py-3 text-sm text-zinc-600">
        Every score is a formula, not a vibe. Click a source to see exactly where its points come from.
      </p>
      <ul>
        {rows.map((d) => {
          const t = trust.get(d.id)!;
          return (
            <li key={d.id} className="border-b border-zinc-100 last:border-0">
              <button onClick={() => setOpen(open === d.id ? null : d.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 md:grid-cols-[1fr_180px_120px]">
                <span>
                  <span className="font-mono text-xs text-zinc-500">{d.id}</span>
                  <span className="block text-sm font-medium">{d.title}</span>
                  <span className="block text-xs text-zinc-500">
                    {d.source} · {d.owner || <b className="text-red-700">no owner</b>} · {d.country} · reviewed {d.last_reviewed}
                  </span>
                </span>
                <span className="hidden flex-wrap gap-1 md:flex">
                  {t.flags.map((f) => (
                    <span key={f} className={`rounded-full px-2 py-0.5 text-xs ring-1 ${KIND[f].cls}`}>
                      {KIND[f].label}
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100">
                    <span className={`block h-full ${trustColor(t.score)}`} style={{ width: `${t.score}%` }} />
                  </span>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums">{t.score}</span>
                </span>
              </button>
              {open === d.id && (
                <ul className="bg-zinc-50 px-4 py-3 font-mono text-xs text-zinc-700">
                  {t.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                  <li className="mt-1 font-semibold">= {t.score}</li>
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExpertsPanel({ analysis, gaps }: { analysis: Analysis; gaps: Gap[] }) {
  const byTopic = new Map<string, Analysis["experts"]>();
  for (const e of analysis.experts) byTopic.set(e.topic, [...(byTopic.get(e.topic) ?? []), e]);
  const undocumented = new Set(analysis.issues.filter((i) => i.kind === "undocumented").map((i) => i.topic));
  const authority = new Map(analysis.docs.map((d) => [d.id, d.authority]));
  const kindOf = (ids: string[]) =>
    ids.some((id) => authority.get(id) === "official")
      ? "wrote official docs"
      : ids.some((id) => authority.get(id) === "team")
        ? "wrote team wiki pages"
        : "answers in chats and mails";
  const topics = [...byTopic.entries()].sort((a, b) => Number(undocumented.has(b[0])) - Number(undocumented.has(a[0])));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="grid gap-3 md:grid-cols-2">
        {topics.map(([topic, people]) => (
          <div key={topic} className={`rounded-2xl border bg-white p-4 ${undocumented.has(topic) ? "border-sky-300" : "border-zinc-200"}`}>
            <p className="text-sm font-medium">{topicLabel(topic)}</p>
            {undocumented.has(topic) && <p className="mt-1 text-xs font-medium text-sky-700">Only in chats: this knowledge leaves with the person</p>}
            <ul className="mt-2 space-y-2">
              {people.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span>
                    <b>{p.name}</b>
                    <span className="block text-xs text-zinc-500">{p.team}</span>
                  </span>
                  <span className="text-right text-xs text-zinc-500">
                    {p.contributions} source{p.contributions > 1 ? "s" : ""}
                    <span className="block">{kindOf(p.doc_ids)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
        <h3 className="font-semibold">Knowledge gaps, live</h3>
        <p className="mt-1 text-xs text-zinc-500">Questions nobody has written an answer to. Each one is routed to the most likely expert.</p>
        {gaps.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-400">No gaps logged yet. Ask something the sources do not cover.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {gaps.map((g) => (
              <li key={g.at} className="rounded-lg bg-zinc-50 p-2">
                <p>{g.question}</p>
                <p className="text-xs text-zinc-500">
                  asked by {g.asked_by} · routed to {g.routed_to ?? "nobody yet"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
