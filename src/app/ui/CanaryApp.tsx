"use client";

// Visual design generated in Lovable (dark navy, deep green, fresh green), wired to the real API.
import { useMemo, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CircleAlert,
  CircleCheck,
  Clock3,
  FileText,
  Fingerprint,
  LockKeyhole,
  LogOut,
  Mail,
  MessageCircle,
  RotateCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { Analysis, AskResult, Doc, Issue, IssueKind, Verdict, VerifyResult } from "@/canary/types";

export type Role = "consultant" | "owner" | "admin";
export interface Account {
  id: string;
  name: string;
  team: string;
  role: Role;
}
export interface Resolution {
  issue_id: string;
  action: "approved" | "dismissed";
  by: string;
  at: string;
}
export interface Gap {
  question: string;
  topic: string;
  routed_to: string | null;
  asked_by: string;
  at: string;
}
type Tab = "Ask" | "Verify" | "Detect" | "Trust" | "Connect";
type Action = "approve" | "dismiss";
type DocMeta = Omit<Doc, "body">;

export type CanaryAppProps = {
  user: Account | null;
  personas: Account[];
  publicStats: { docs: number; claims: number; issues: number };
  analysis: Analysis | null;
  resolutions: Resolution[];
  gaps: Gap[];
  onLogin: (userId: string, password: string) => Promise<string | null>;
  onLogout: () => Promise<void>;
  onAsk: (question: string) => Promise<AskResult>;
  onVerify: (draft: string) => Promise<VerifyResult>;
  onResolve: (issueId: string, action: Action) => Promise<string | null>;
  onRescan: () => Promise<string | null>;
};

const ROLE_LABEL: Record<Role, string> = { consultant: "Payroll consultant", owner: "Content owner", admin: "Knowledge admin" };
const EXAMPLES = [
  { label: "Can recruiters ask current salary?", question: "Can our recruiters still ask a candidate what they earn now?" },
  { label: "Payroll input deadline", question: "What is the deadline for monthly variable payroll input in Belgium?" },
  { label: "Cross-border social security", question: "An employee lives in Belgium and works 40% in the Netherlands. Which social security applies?" },
  { label: "Bike allowance", question: "How much is the bike allowance for internal staff?" },
];
const kinds: { kind: IssueKind; label: string }[] = [
  { kind: "outdated_by_law", label: "Outdated by law" },
  { kind: "conflict", label: "Conflict" },
  { kind: "undocumented", label: "Only in chats" },
  { kind: "quarantined", label: "Quarantined" },
];
const statusCopy: Record<AskResult["status"], { label: string; meaning: string; color: string; bar: string; hint: string }> = {
  answered: { label: "Verified answer", meaning: "Supported by current, traceable sources", color: "bg-success-soft text-success-foreground", bar: "bg-success", hint: "Use with confidence" },
  unverified: { label: "Unverified", meaning: "Only chats and emails say this, no official source", color: "bg-warning-soft text-warning-foreground", bar: "bg-warning", hint: "Proceed with care" },
  conflict: { label: "Sources disagree", meaning: "Canary won't pick a side. The owner decides", color: "bg-conflict-soft text-conflict-foreground", bar: "bg-conflict", hint: "Verify with an expert" },
  no_source: { label: "No trusted source", meaning: "Nothing written covers this. Logged as a gap", color: "bg-muted text-muted-foreground", bar: "bg-muted-foreground", hint: "Ask an expert" },
  blocked: { label: "Blocked", meaning: "This request tried to change Canary's instructions", color: "bg-ink text-primary-foreground", bar: "bg-ink", hint: "Unsafe request" },
};
const kindStyle: Record<IssueKind, string> = {
  outdated_by_law: "bg-danger-soft text-danger-foreground",
  conflict: "bg-conflict-soft text-conflict-foreground",
  undocumented: "bg-chat-soft text-navy",
  quarantined: "bg-ink text-primary-foreground",
};

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function Button({
  variant = "primary",
  size = "normal",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "navy"; size?: "normal" | "small" | "icon" }) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    navy: "bg-navy-soft text-primary-foreground hover:bg-navy-soft/80 border border-primary-foreground/15",
  };
  const sizes = { normal: "h-10 px-4 text-sm", small: "h-8 px-3 text-xs", icon: "size-9 text-sm" };
  return <button className={`${buttonBase} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

function BirdMark({ compact = false }: { compact?: boolean }) {
  return (
    <span aria-hidden="true" className={`relative inline-flex ${compact ? "size-8" : "size-10"} shrink-0 items-center justify-center rounded-full bg-success text-navy shadow-inner`}>
      <span className="absolute left-[24%] top-[34%] size-[46%] rotate-[-28deg] rounded-full bg-brand-bird" />
      <span className="absolute left-[44%] top-[22%] size-[29%] rounded-full bg-brand-bird" />
      <span className="absolute left-[66%] top-[37%] size-[17%] bg-brand-bird [clip-path:polygon(0_0,100%_50%,0_100%)]" />
      <span className="absolute left-[60%] top-[29%] size-[5%] rounded-full bg-navy" />
    </span>
  );
}

function IconBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold leading-tight ${className}`}>{children}</span>;
}

function dateLabel(value?: string) {
  if (!value) return "Not reviewed";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
}

function topicLabel(topic: string) {
  return topic.split(".").at(-1)?.replaceAll("_", " ") || topic;
}

const barWidths = ["w-[0%]", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-[25%]", "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-[50%]", "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-[75%]", "w-[80%]", "w-[85%]", "w-[90%]", "w-[95%]", "w-[100%]"];
function barWidth(value: number) {
  return barWidths[Math.max(0, Math.min(20, Math.round(value / 5)))] ?? "w-[0%]";
}

function SectionHead({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</div>
      <h1 className="text-3xl font-semibold text-foreground md:text-[34px]">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
  );
}

export function CanaryApp(props: CanaryAppProps) {
  const { user, analysis } = props;
  if (!user) return <SignIn {...props} />;
  if (!analysis) return <main className="flex min-h-screen items-center justify-center bg-navy text-sm text-primary-foreground/70">Loading the latest scan…</main>;
  return <Workspace {...props} user={user} analysis={analysis} />;
}

function SignIn({ personas, publicStats, onLogin }: CanaryAppProps) {
  const [selected, setSelected] = useState("ann");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const err = await onLogin(selected, password);
    setBusy(false);
    if (err) setError(err);
    else setPassword("");
  }

  return (
    <main className="flex min-h-screen flex-col bg-navy text-primary-foreground">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-6 py-8 lg:px-12">
        <BirdMark compact />
        <span className="text-xl font-bold tracking-normal">
          canary<span className="text-brand-bird">.</span>
        </span>
        <span className="ml-3 hidden border-l border-primary-foreground/25 pl-4 text-xs text-primary-foreground/60 sm:block">Knowledge that knows when it&apos;s wrong.</span>
      </div>
      <div className="mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-12 px-6 pb-16 lg:grid-cols-[1fr_440px] lg:px-12">
        <div className="max-w-[620px] py-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-success">
            <span className="size-1.5 rounded-full bg-success" /> SD Worx track · Tectonic Hackathon
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] text-primary-foreground md:text-6xl">
            Knowledge that knows <span className="text-success">when it&apos;s wrong.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-primary-foreground/65">
            When the law changes, Canary finds which of your own documents just became wrong, tells you which answer you can trust, and who to call when documents aren&apos;t enough.
          </p>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
            <div>
              <div className="text-2xl font-semibold">{publicStats.docs}</div>
              <div className="mt-1 text-xs text-primary-foreground/50">Sources scanned</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{publicStats.claims}</div>
              <div className="mt-1 text-xs text-primary-foreground/50">Claims traced</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{publicStats.issues}</div>
              <div className="mt-1 text-xs text-primary-foreground/50">Issues surfaced</div>
            </div>
          </div>
        </div>
        <form onSubmit={signIn} className="rounded-lg border border-border bg-card p-6 text-foreground shadow-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Welcome</div>
              <h2 className="mt-2 text-2xl font-semibold">Sign in to Canary</h2>
            </div>
            <div className="rounded-lg bg-success-soft p-3 text-primary">
              <Fingerprint size={23} />
            </div>
          </div>
          <span className="mb-3 block text-xs font-semibold text-foreground">Choose a demo profile</span>
          <div className="space-y-2">
            {personas.map((p) => (
              <button
                type="button"
                key={p.id}
                aria-pressed={selected === p.id}
                onClick={() => setSelected(p.id)}
                className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === p.id ? "border-primary bg-success-soft" : "border-border hover:border-primary/40"}`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{initials(p.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                </span>
                <span className={`flex size-4 items-center justify-center rounded-full border ${selected === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {selected === p.id && <Check size={11} strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
          <label htmlFor="demo-password" className="mb-2 mt-6 block text-xs font-semibold">
            Password
          </label>
          <div className="relative">
            <LockKeyhole size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
            <input
              id="demo-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-card pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger-foreground">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="mt-6 h-11 w-full">
            {busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} />
          </Button>
          <p className="mt-5 text-center text-xs text-muted-foreground">Demo data is synthetic. Each profile has its own password.</p>
        </form>
      </div>
      <div className="mx-auto w-full max-w-[1280px] border-t border-primary-foreground/10 px-6 py-5 text-xs text-primary-foreground/40 lg:px-12">CANARY / KNOWLEDGE THAT KNOWS WHEN IT&apos;S WRONG</div>
    </main>
  );
}

function Workspace({ user, analysis, resolutions, gaps, onAsk, onVerify, onResolve, onLogout, onRescan }: CanaryAppProps & { user: Account; analysis: Analysis }) {
  const [tab, setTab] = useState<Tab>("Ask");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [filter, setFilter] = useState<IssueKind | "all">("all");
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const docs = useMemo(() => new Map(analysis.docs.map((d) => [d.id, d])), [analysis.docs]);
  const claims = useMemo(() => new Map(analysis.claims.map((c) => [c.id, c])), [analysis.claims]);
  const resolved = useMemo(() => new Map(resolutions.map((r) => [r.issue_id, r])), [resolutions]);
  const isAdmin = user.role === "admin";

  const notify = (text: string, bad = false) => {
    setToast({ text, bad });
    window.setTimeout(() => setToast(null), 4500);
  };
  const ask = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 5 || loading) return;
    setQuestion(trimmed);
    setAskedQuestion(trimmed);
    setAnswer(null);
    setLoading(true);
    try {
      setAnswer(await onAsk(trimmed));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not load an answer. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };
  const resolve = async (issue: Issue, action: Action) => {
    const err = await onResolve(issue.id, action);
    if (err) notify(err, true);
    else notify(action === "approve" ? `Approved by ${user.name}. Canary re-checks the source on the next scan.` : `Dismissed by ${user.name}.`);
  };
  const rescan = async () => {
    setScanning(true);
    const err = await onRescan();
    setScanning(false);
    notify(err ?? "Scan complete: every source re-checked.", Boolean(err));
  };
  const openIssues = analysis.issues.filter((i) => !resolved.has(i.id));
  const healthDeg = Math.round((analysis.health / 100) * 360);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-navy text-primary-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-5 py-4 md:px-9 xl:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <BirdMark compact />
            <div>
              <div className="text-lg font-bold leading-5">
                canary<span className="text-brand-bird">.</span>
              </div>
              <div className="hidden text-[10px] text-primary-foreground/55 sm:block">Knowledge that knows when it&apos;s wrong.</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 md:gap-6">
            <div className="hidden items-center gap-3 border-r border-primary-foreground/15 pr-5 sm:flex" aria-label={`Knowledge health ${analysis.health} out of 100`}>
              <div className="relative flex size-11 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--success) ${healthDeg}deg, var(--navy-soft) 0deg)` }}>
                <span className="absolute inset-[4px] rounded-full bg-navy" />
                <span className="relative text-sm font-bold">{analysis.health}</span>
              </div>
              <div className="text-[11px] leading-4 text-primary-foreground/55">
                Knowledge
                <br />
                <span className="font-semibold text-primary-foreground">health / 100</span>
              </div>
            </div>
            {isAdmin && (
              <Button variant="navy" size="small" onClick={rescan} disabled={scanning}>
                <RotateCw size={13} className={scanning ? "animate-spin" : ""} /> <span className="hidden sm:inline">{scanning ? "Scanning all sources…" : "Re-scan sources"}</span>
                <span className="sm:hidden">Re-scan</span>
              </Button>
            )}
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-success-soft text-[11px] font-bold text-primary">{initials(user.name)}</span>
              <div className="hidden leading-4 md:block">
                <div className="text-xs font-semibold">{user.name}</div>
                <div className="text-[11px] text-primary-foreground/55">{ROLE_LABEL[user.role]}</div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={onLogout} className="text-primary-foreground/65 hover:bg-navy-soft hover:text-primary-foreground">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-y-4 px-5 py-4 sm:grid-cols-3 md:px-9 lg:grid-cols-6 xl:px-12">
          {[
            { label: "Sources scanned", value: analysis.stats.docs, icon: <FileText size={15} /> },
            { label: "Claims traced to a sentence", value: `${analysis.stats.grounded_claims}/${analysis.stats.claims}`, icon: <CheckCheck size={15} /> },
            { label: "Outdated by law", value: analysis.stats.outdated, icon: <Clock3 size={15} />, tone: "text-danger-foreground" },
            { label: "Conflicts", value: analysis.stats.conflicts, icon: <CircleAlert size={15} />, tone: "text-conflict-foreground" },
            { label: "Only in chats", value: analysis.stats.undocumented, icon: <MessageCircle size={15} />, tone: "text-chat" },
            { label: "Quarantined", value: analysis.stats.quarantined, icon: <ShieldAlert size={15} />, tone: "text-ink" },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 ${i ? "lg:border-l lg:border-border lg:pl-6" : ""}`}>
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-muted ${s.tone || "text-primary"}`}>{s.icon}</div>
              <div>
                <div className={`text-lg font-semibold leading-5 ${s.tone || "text-foreground"}`}>{s.value}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav aria-label="Main navigation" className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 md:px-9 xl:px-12">
          {(["Ask", "Verify", "Detect", "Trust", "Connect"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={`flex h-14 shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "Ask" && <Search size={16} />}
              {t === "Verify" && <ClipboardCheck size={16} />}
              {t === "Detect" && <Bell size={16} />}
              {t === "Trust" && <ShieldCheck size={16} />}
              {t === "Connect" && <Users size={16} />}
              {t}
              {(t === "Detect" || t === "Trust") && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${tab === t ? "bg-success-soft text-primary" : "bg-muted text-muted-foreground"}`}>{t === "Detect" ? openIssues.length : analysis.stats.docs}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-[1440px] px-5 py-9 md:px-9 md:py-11 xl:px-12">
        {tab === "Ask" && (
          <AskView question={question} setQuestion={setQuestion} ask={ask} answer={answer} askedQuestion={askedQuestion} loading={loading} docs={docs} claimCount={analysis.stats.grounded_claims} notify={notify} />
        )}
        {tab === "Verify" && <VerifyView onVerify={onVerify} docs={docs} notify={notify} />}
        {tab === "Detect" && <DetectView issues={analysis.issues} resolved={resolved} filter={filter} setFilter={setFilter} docs={docs} claims={claims} security={analysis.security} user={user} resolve={resolve} />}
        {tab === "Trust" && <TrustView analysis={analysis} docs={docs} openDoc={openDoc} setOpenDoc={setOpenDoc} />}
        {tab === "Connect" && <ConnectView analysis={analysis} docs={docs} gaps={gaps} notify={notify} />}
      </main>

      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-md border border-border px-4 py-3 text-sm text-primary-foreground shadow-xl ${toast.bad ? "bg-danger-foreground" : "bg-ink"}`}>
          {toast.bad ? <CircleAlert size={17} /> : <CircleCheck size={17} className="text-success" />}
          {toast.text}
          <button aria-label="Dismiss notification" onClick={() => setToast(null)} className="ml-3 rounded p-1 focus-visible:ring-2 focus-visible:ring-ring">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function AskView({
  question,
  setQuestion,
  ask,
  answer,
  askedQuestion,
  loading,
  docs,
  claimCount,
  notify,
}: {
  question: string;
  setQuestion: (v: string) => void;
  ask: (q: string) => void;
  answer: AskResult | null;
  askedQuestion: string;
  loading: boolean;
  docs: Map<string, DocMeta>;
  claimCount: number;
  notify: (v: string) => void;
}) {
  return (
    <>
      <SectionHead eyebrow="01 / Ask Canary" title="Find an answer you can stand behind." description="The answer, the evidence and the caveats, in one place." />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_296px]">
        <div className="min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <label htmlFor="question" className="block text-sm font-semibold">
              A client is on the phone. What do you need to know?
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={19} className="absolute left-4 top-3.5 text-muted-foreground" />
                <input
                  id="question"
                  value={question}
                  maxLength={400}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a payroll or HR question…"
                  className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" disabled={loading || question.trim().length < 5} className="h-12 px-6">
                Ask Canary <ArrowRight size={16} />
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-muted-foreground">Try an example</span>
              {EXAMPLES.map((e) => (
                <button
                  type="button"
                  key={e.question}
                  onClick={() => ask(e.question)}
                  title={e.question}
                  className="rounded border border-border bg-background px-2.5 py-1.5 text-left text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {e.label} <ArrowUpRight size={11} className="inline" />
                </button>
              ))}
            </div>
          </form>
          {loading && (
            <div aria-live="polite" className="mt-6 rounded-lg border border-border bg-card p-7 shadow-sm">
              <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-primary">
                <span className="flex size-8 items-center justify-center rounded-full bg-success-soft">
                  <Sparkles size={16} />
                </span>
                Reading {claimCount} verified claims, checking dates, owners and conflicts…
              </div>
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-36 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
                <div className="h-24 rounded bg-muted" />
              </div>
            </div>
          )}
          {answer && !loading && <AnswerCard answer={answer} question={askedQuestion} docs={docs} notify={notify} />}
          {!answer && !loading && (
            <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 px-6 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-success-soft text-primary">
                <BookOpen size={22} />
              </span>
              <h2 className="text-base font-semibold">The full picture, before you answer.</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Ask a question or pick an example to see what the sources say, and whether you can trust them.</p>
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} className="text-primary" /> How Canary answers
            </div>
            <ol className="space-y-5">
              {[
                ["01", "Find the exact sentence", "A fact only counts if its quote is in the source, word for word."],
                ["02", "Check its standing", "How official, how recent, who owns it, which country."],
                ["03", "Spot disagreement", "Outdated, conflicting and poisoned sources are set aside."],
                ["04", "Find the right person", "When documents aren't enough, you get a name."],
              ].map(([n, title, text]) => (
                <li key={n} className="flex gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">{n}</span>
                  <div>
                    <div className="text-xs font-semibold">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold">What the statuses mean</div>
            <div className="space-y-3">
              {(Object.keys(statusCopy) as AskResult["status"][]).map((key) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className={`rounded px-2 py-1 text-[11px] font-semibold ${statusCopy[key].color}`}>{statusCopy[key].label}</span>
                  <span className="text-right text-[11px] text-muted-foreground">{statusCopy[key].hint}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function AnswerCard({ answer, question, docs, notify }: { answer: AskResult; question: string; docs: Map<string, DocMeta>; notify: (v: string) => void }) {
  const state = statusCopy[answer.status];
  return (
    <article className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <IconBadge className={state.color}>
            <span className="mr-1.5">{answer.status === "answered" ? <CircleCheck size={13} /> : <CircleAlert size={13} />}</span>
            {state.label}
          </IconBadge>
          <span className="text-xs text-muted-foreground">{state.meaning}</span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Answer to your question</div>
        <h2 className="mt-2 text-sm font-medium text-muted-foreground">{question}</h2>
        <p className="mt-5 text-lg font-medium leading-8 text-foreground sm:text-xl">{answer.answer}</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">Confidence</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${state.bar} ${barWidth(answer.confidence * 100)}`} />
          </div>
          <span className="w-10 text-right font-mono text-xs font-semibold">{Math.round(answer.confidence * 100)}%</span>
        </div>
      </div>
      {answer.citations.length > 0 && (
        <div className="border-b border-border px-6 py-6 sm:px-7">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={17} className="text-primary" /> Why you can rely on it
          </h3>
          <div className="mt-4 space-y-3">
            {answer.citations.map((cite, i) => {
              const d = docs.get(cite.doc_id);
              return (
                <div key={`${cite.doc_id}-${i}`} className="rounded-md border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] font-semibold text-primary">{cite.doc_id}</div>
                      <div className="mt-1 text-sm font-semibold">{cite.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {d?.type || "Source"} · {d?.owner || "No owner"} · Reviewed {dateLabel(d?.last_reviewed)}
                      </div>
                    </div>
                    <IconBadge className={cite.trust >= 70 ? "bg-success-soft text-success-foreground" : "bg-warning-soft text-warning-foreground"}>Trust {cite.trust}/100</IconBadge>
                  </div>
                  <blockquote className="mt-4 border-l-2 border-success pl-3 text-sm italic leading-6 text-foreground/80">&ldquo;{cite.quote}&rdquo;</blockquote>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {answer.ignored.length > 0 && (
        <div className="border-b border-border px-6 py-6 sm:px-7">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={16} className="text-muted-foreground" /> What Canary ignored, and why
          </h3>
          <div className="mt-4 space-y-3">
            {answer.ignored.map((ignored, i) => (
              <div key={i} className="text-xs leading-5">
                <span className="font-mono text-muted-foreground line-through">{ignored.doc_id}</span>{" "}
                <span className="text-muted-foreground line-through">{docs.get(ignored.doc_id)?.title}</span>
                <div className="text-foreground/80">{ignored.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {answer.escalate && (
        <div className="flex flex-wrap items-center gap-4 bg-success-soft/45 px-6 py-5 sm:px-7">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials(answer.escalate.name)}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Talk to</div>
            <div className="mt-0.5 text-sm font-semibold">
              {answer.escalate.name} <span className="font-normal text-muted-foreground">· {answer.escalate.team}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{answer.escalate.reason}</p>
          </div>
          <Button size="small" onClick={() => notify(`Handed to ${answer.escalate?.name} with the question and sources attached (demo: a Teams message in production)`)}>
            <Send size={13} /> Send with context
          </Button>
        </div>
      )}
    </article>
  );
}

const EXAMPLE_DRAFT = `Hi Els,

Thanks for your questions. Yes, your recruiters can keep asking candidates for their current salary in the first interview, that is still standard practice. For the overtime: monthly variable input needs to reach us by the 5th working day of the following month. The Dimona has to be filed at the latest when the new employee starts working. And employees have no right to any information about what colleagues earn, so you can refuse those requests.

Kind regards,
Ann`;

const verdictCopy: Record<Verdict, { label: string; color: string; border: string; meaning: string }> = {
  supported: { label: "Supported", color: "bg-success-soft text-success-foreground", border: "border-success/30", meaning: "A current source agrees" },
  contradicted: { label: "Wrong", color: "bg-danger-soft text-danger-foreground", border: "border-danger-foreground/25", meaning: "A current source says otherwise" },
  disputed: { label: "Disputed", color: "bg-conflict-soft text-conflict-foreground", border: "border-conflict/40", meaning: "Sources disagree" },
  no_source: { label: "No source", color: "bg-muted text-muted-foreground", border: "border-border", meaning: "Nothing written covers it" },
};

function VerifyView({ onVerify, docs, notify }: { onVerify: (draft: string) => Promise<VerifyResult>; docs: Map<string, DocMeta>; notify: (v: string, bad?: boolean) => void }) {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function check(event?: FormEvent) {
    event?.preventDefault();
    if (draft.trim().length < 20 || loading) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await onVerify(draft));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not check the draft.", true);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Safe version copied. Review it before you send.");
    } catch {
      notify("Could not copy. Select the text instead.", true);
    }
  }

  const counts = result?.counts;
  const problems = counts ? counts.contradicted + counts.disputed + counts.no_source : 0;
  return (
    <>
      <SectionHead eyebrow="02 / Verify" title="Check your reply before you send it." description="Paste the email you're about to send to a client. Canary checks every claim in it against current, owned sources." />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_296px]">
        <div className="min-w-0">
          <form onSubmit={check} className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <label htmlFor="draft" className="block text-sm font-semibold">
              Your draft reply
            </label>
            <textarea
              id="draft"
              value={draft}
              maxLength={2000}
              rows={9}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Hi Els, …"
              className="mt-3 w-full resize-y rounded-md border border-input bg-background p-4 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraft(EXAMPLE_DRAFT);
                  setResult(null);
                }}
                className="rounded border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Load an example draft <ArrowUpRight size={11} className="inline" />
              </button>
              <Button type="submit" disabled={loading || draft.trim().length < 20}>
                <ClipboardCheck size={16} /> {loading ? "Checking every statement…" : "Check before sending"}
              </Button>
            </div>
          </form>

          {loading && (
            <div aria-live="polite" className="mt-6 animate-pulse rounded-lg border border-border bg-card p-7 text-sm font-semibold text-primary shadow-sm">
              Splitting your draft into statements and checking each one against the sources…
            </div>
          )}

          {result && !loading && result.status === "blocked" && (
            <div className="mt-6 rounded-lg bg-ink p-6 text-sm text-primary-foreground">This draft contains instructions aimed at the assistant, so it was not sent to the model.</div>
          )}

          {result && counts && !loading && result.status === "checked" && (
            <div className="mt-6 space-y-4">
              <div className={`rounded-lg p-5 ${result.safe_to_send ? "bg-success-soft text-success-foreground" : "bg-navy text-primary-foreground"}`}>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {result.safe_to_send ? <CircleCheck size={20} /> : <ShieldAlert size={20} className="text-brand-bird" />}
                  {result.safe_to_send ? "Safe to send." : "Don't send this yet."}
                </div>
                <p className={`mt-1 text-sm ${result.safe_to_send ? "" : "text-primary-foreground/70"}`}>
                  {result.safe_to_send
                    ? "Every statement is backed by a current source."
                    : `${counts.contradicted} wrong, ${counts.disputed} disputed, ${counts.no_source} without a source, ${counts.supported} supported. ${problems} statement${problems === 1 ? "" : "s"} to fix.`}
                </p>
              </div>

              {result.statements.map((s, i) => (
                <article key={i} className={`rounded-lg border bg-card p-5 shadow-sm ${verdictCopy[s.verdict].border}`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <IconBadge className={verdictCopy[s.verdict].color}>{verdictCopy[s.verdict].label}</IconBadge>
                    <span className="text-[11px] text-muted-foreground">{s.topic.replaceAll(".", " / ").replaceAll("_", " ")}</span>
                  </div>
                  <blockquote className="border-l-2 border-border pl-3 text-sm italic leading-6">&ldquo;{s.text}&rdquo;</blockquote>
                  {s.explanation && <p className="mt-3 text-sm leading-6 text-muted-foreground">{s.explanation}</p>}
                  {s.correction && (
                    <p className="mt-3 rounded-md bg-success-soft/50 px-3 py-2 text-sm leading-6">
                      <span className="font-semibold text-success-foreground">Write instead: </span>
                      {s.correction}
                    </p>
                  )}
                  {s.citations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {s.citations.map((cite) => (
                        <div key={cite.doc_id} className="rounded-md border border-border bg-background p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              <span className="font-mono font-semibold text-primary">{cite.doc_id}</span> · {cite.title} · {docs.get(cite.doc_id)?.owner || "no owner"}
                            </span>
                            <IconBadge className={cite.trust >= 70 ? "bg-success-soft text-success-foreground" : "bg-warning-soft text-warning-foreground"}>Trust {cite.trust}</IconBadge>
                          </div>
                          <div className="mt-2 italic text-foreground/80">&ldquo;{cite.quote}&rdquo;</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.route && (
                    <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials(s.route.name)}</span>
                      <span>
                        <span className="font-semibold">{s.route.name}</span> <span className="text-muted-foreground">· {s.route.team}</span>
                        <span className="block text-muted-foreground">{s.route.reason}</span>
                      </span>
                    </div>
                  )}
                </article>
              ))}

              {result.corrected_draft && (
                <div className="rounded-lg border border-dashed border-primary/35 bg-card p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
                      <Sparkles size={13} /> Suggested safe version <span className="font-normal normal-case tracking-normal text-muted-foreground">· review before sending</span>
                    </div>
                    <Button size="small" variant="outline" onClick={() => copy(result.corrected_draft)}>
                      <Copy size={13} /> Copy
                    </Button>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6">{result.corrected_draft}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck size={16} className="text-primary" /> Why this matters
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              A wrong answer costs the most once it reaches a client. Canary checks the reply at the last moment, when it can still be fixed, and tells you who to ask about anything it can&apos;t confirm.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold">Verdicts</div>
            <div className="space-y-3">
              {(Object.keys(verdictCopy) as Verdict[]).map((v) => (
                <div key={v} className="flex items-center justify-between gap-2">
                  <IconBadge className={verdictCopy[v].color}>{verdictCopy[v].label}</IconBadge>
                  <span className="text-right text-[11px] text-muted-foreground">{verdictCopy[v].meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function DetectView({
  issues,
  resolved,
  filter,
  setFilter,
  docs,
  claims,
  security,
  user,
  resolve,
}: {
  issues: Issue[];
  resolved: Map<string, Resolution>;
  filter: IssueKind | "all";
  setFilter: (v: IssueKind | "all") => void;
  docs: Map<string, DocMeta>;
  claims: Map<string, Analysis["claims"][number]>;
  security: Analysis["security"];
  user: Account;
  resolve: (issue: Issue, action: Action) => void;
}) {
  const visible = issues.filter((issue) => filter === "all" || issue.kind === filter);
  const legal = [...docs.values()].find((d) => d.type === "legal-update");
  const lawIssues = issues.filter((i) => i.kind === "outdated_by_law");
  const lawDocs = new Set(lawIssues.map((i) => i.doc_ids[0])).size;
  return (
    <>
      <SectionHead eyebrow="03 / Detect" title="The things that need a second look." description="Outdated rules, conflicting guidance and answers that only live in chats, brought into the open." />
      {legal && lawIssues.length > 0 && (
        <div className="relative mb-7 overflow-hidden rounded-lg bg-navy p-6 text-primary-foreground sm:p-8">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 [background:repeating-linear-gradient(135deg,transparent,transparent_16px,currentColor_17px,currentColor_18px)]" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success" /> LEGAL CHANGE DETECTED · {legal.id}
            </div>
            <h2 className="max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
              {lawIssues.length} statements in {lawDocs} documents now give the wrong answer.
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/65">
              {legal.title} · In force since {dateLabel(legal.effective)}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-success">
              <ArrowDownRight size={15} /> Each one goes to its owner with a suggested rewrite
            </div>
          </div>
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
        >
          All issues <span className="ml-1 opacity-70">{issues.length}</span>
        </button>
        {kinds.map((k) => (
          <button
            key={k.kind}
            onClick={() => setFilter(k.kind)}
            className={`rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === k.kind ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {k.label} <span className="ml-1 opacity-70">{issues.filter((i) => i.kind === k.kind).length}</span>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {visible.map((issue) => {
          const done = resolved.get(issue.id);
          const canResolve = user.role === "admin" || issue.owner.name === user.name;
          const issueClaims = issue.claim_ids.map((id) => claims.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
          const injected = security.find((s) => s.doc_id === issue.doc_ids[0] && s.rule === "override-instructions") ?? security.find((s) => s.doc_id === issue.doc_ids[0]);
          return (
            <article key={issue.id} className={`rounded-lg border border-border bg-card p-5 shadow-sm transition-opacity sm:p-6 ${done ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <IconBadge className={kindStyle[issue.kind]}>{kinds.find((k) => k.kind === issue.kind)?.label}</IconBadge>
                    <IconBadge className={issue.severity === "high" ? "bg-danger-soft text-danger-foreground" : "bg-muted text-muted-foreground"}>{issue.severity} priority</IconBadge>
                    <span className="text-[11px] text-muted-foreground">{issue.topic.replaceAll(".", " / ").replaceAll("_", " ")}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-7">{issue.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{issue.explanation}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-md bg-muted px-3 py-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-card text-[10px] font-bold text-primary">{initials(issue.owner.name)}</span>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Owner</div>
                    <div className="text-xs font-semibold">{issue.owner.name}</div>
                    <div className="text-[10px] text-muted-foreground">{issue.owner.team}</div>
                  </div>
                </div>
              </div>
              {issueClaims.length > 0 && issue.kind !== "undocumented" && (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {issueClaims.slice(0, 2).map((claim, i) => {
                    const d = docs.get(claim.doc_id);
                    return (
                      <div key={claim.id} className={`rounded-md border p-4 ${i === 0 ? "border-danger-foreground/15 bg-danger-soft/60" : "border-success/20 bg-success-soft/60"}`}>
                        <div className={`mb-3 text-[11px] font-bold uppercase tracking-[0.12em] ${i === 0 ? "text-danger-foreground" : "text-success-foreground"}`}>{i === 0 ? "Says" : "But"}</div>
                        <blockquote className="text-sm leading-6">&ldquo;{claim.quote}&rdquo;</blockquote>
                        <div className="mt-4 border-t border-foreground/10 pt-3 text-[11px] text-muted-foreground">
                          <span className="font-mono font-semibold text-foreground">{claim.doc_id}</span> · {d?.type} · Reviewed {dateLabel(d?.last_reviewed)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {issue.kind === "quarantined" && injected && (
                <div className="mt-5 overflow-hidden rounded-md bg-ink p-4 font-mono text-xs leading-6 text-primary-foreground/80">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-success">Injection detected · source isolated before any AI read it</div>
                  <pre className="whitespace-pre-wrap break-words">{injected.excerpt}</pre>
                </div>
              )}
              {issue.incident_doc_ids.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-danger-foreground">
                  <CircleAlert size={14} />
                  <strong>Already caused harm:</strong>
                  {issue.incident_doc_ids.map((id) => (
                    <span key={id} className="font-mono">
                      {id} · {docs.get(id)?.title}
                    </span>
                  ))}
                </div>
              )}
              {issue.captured_in && issue.captured_in.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-chat">
                  <Mail size={14} />
                  <strong>The right answer already exists in an inbox:</strong>
                  {issue.captured_in.map((id) => (
                    <span key={id} className="font-mono">
                      {id} by {docs.get(id)?.owner}
                    </span>
                  ))}
                </div>
              )}
              {issue.kind === "undocumented" && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-chat">
                  <MessageCircle size={14} />
                  <strong>Knowledge that only lives in conversations:</strong>
                  {issue.doc_ids.map((id) => (
                    <span key={id} className="font-mono">
                      {id}
                    </span>
                  ))}
                </div>
              )}
              {issue.suggested_fix && (
                <div className="mt-5 rounded-md border border-dashed border-primary/35 bg-success-soft/35 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
                    <Sparkles size={13} /> Suggested {issue.kind === "undocumented" ? "draft article" : "rewrite"} <span className="font-normal normal-case tracking-normal text-muted-foreground">· needs human approval</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6">{issue.suggested_fix}</p>
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                {done ? (
                  <span className="flex items-center gap-2 text-xs font-semibold text-success-foreground">
                    <CircleCheck size={14} /> {done.action === "approved" ? "Approved" : "Dismissed"} by {done.by}
                  </span>
                ) : canResolve ? (
                  <span className="text-xs text-muted-foreground">Review as {user.name}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LockKeyhole size={12} /> Only {issue.owner.name} or a knowledge admin can approve this. The server checks it too.
                  </span>
                )}
                {!done && (
                  <div className="flex gap-2">
                    <Button size="small" variant="outline" onClick={() => resolve(issue, "dismiss")} disabled={!canResolve}>
                      {issue.kind === "quarantined" ? "Release source" : "Dismiss"}
                    </Button>
                    <Button size="small" onClick={() => resolve(issue, "approve")} disabled={!canResolve}>
                      <Check size={13} /> {issue.kind === "undocumented" ? "Validate and publish" : issue.kind === "quarantined" ? "Keep quarantined" : "Approve"}
                    </Button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {visible.length === 0 && <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">No issues in this category.</div>}
      </div>
    </>
  );
}

function TrustView({ analysis, docs, openDoc, setOpenDoc }: { analysis: Analysis; docs: Map<string, DocMeta>; openDoc: string | null; setOpenDoc: (v: string | null) => void }) {
  const ranked = [...analysis.trust].sort((a, b) => b.score - a.score);
  return (
    <>
      <SectionHead eyebrow="04 / Trust" title="Know what your sources are worth." description="Every score is a formula, not a vibe. Click a source to see exactly where its points come from." />
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_95px_160px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:grid">
          <span>Source</span>
          <span>System / owner</span>
          <span>Country</span>
          <span>Reviewed</span>
          <span>Trust score</span>
        </div>
        {ranked.map((entry) => {
          const d = docs.get(entry.doc_id);
          const open = openDoc === entry.doc_id;
          return (
            <div key={entry.doc_id} className="border-b border-border last:border-0">
              <button
                onClick={() => setOpenDoc(open ? null : entry.doc_id)}
                aria-expanded={open}
                className="grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_95px_160px] lg:items-center lg:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-primary">
                    <ChevronRight size={14} className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                    {entry.doc_id}
                  </div>
                  <div className="mt-1 pl-[22px] text-sm font-semibold leading-5">{d?.title || "Unknown source"}</div>
                  <div className="mt-2 flex flex-wrap gap-1 pl-[22px]">
                    {entry.flags.map((flag) => (
                      <IconBadge key={flag} className={kindStyle[flag]}>
                        {kinds.find((k) => k.kind === flag)?.label}
                      </IconBadge>
                    ))}
                  </div>
                </div>
                <div className="pl-[22px] text-xs lg:pl-0">
                  <div className="text-muted-foreground">{d?.source || "Unknown"}</div>
                  <div className={`mt-1 font-medium ${d?.owner ? "text-foreground" : "text-danger-foreground"}`}>{d?.owner || "No owner"}</div>
                </div>
                <div className="pl-[22px] text-xs text-muted-foreground lg:pl-0">{d?.country || "—"}</div>
                <div className="pl-[22px] text-xs text-muted-foreground lg:pl-0">{dateLabel(d?.last_reviewed)}</div>
                <div className="flex items-center gap-3 pl-[22px] lg:pl-0">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${entry.score >= 70 ? "bg-success" : entry.score >= 45 ? "bg-warning" : "bg-destructive"} ${barWidth(entry.score)}`} />
                  </div>
                  <span className="w-7 text-right font-mono text-sm font-bold">{entry.score}</span>
                </div>
              </button>
              {open && (
                <div className="border-t border-border bg-muted/45 px-6 py-5 lg:pl-12">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Score breakdown</div>
                  <div className="space-y-1 font-mono text-xs leading-5 text-muted-foreground">
                    {entry.reasons.map((r, i) => (
                      <div key={i}>{r}</div>
                    ))}
                    <div className="mt-2 border-t border-border pt-2 font-semibold text-foreground">= {entry.score} / 100</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ConnectView({ analysis, docs, gaps, notify }: { analysis: Analysis; docs: Map<string, DocMeta>; gaps: Gap[]; notify: (v: string) => void }) {
  const chatOnly = analysis.issues.filter((i) => i.kind === "undocumented");
  const gapTopics = new Set(chatOnly.map((i) => i.topic));
  const experts = [...analysis.experts].sort((a, b) => Number(gapTopics.has(b.topic)) - Number(gapTopics.has(a.topic)) || b.contributions - a.contributions);
  return (
    <>
      <SectionHead eyebrow="05 / Connect" title="Find the person behind the answer." description="When the documents run out, the right expert shouldn't be hard to find." />
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid auto-rows-max gap-4 md:grid-cols-2">
          {experts.map((expert, i) => (
            <article key={`${expert.topic}-${expert.name}-${i}`} className={`rounded-lg border p-5 shadow-sm ${gapTopics.has(expert.topic) ? "border-chat/30 bg-chat-soft/40" : "border-border bg-card"}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase text-primary">{topicLabel(expert.topic)}</span>
                {gapTopics.has(expert.topic) ? <IconBadge className="bg-chat-soft text-navy">Only in chats</IconBadge> : expert.official && <IconBadge className="bg-success-soft text-success-foreground">Wrote official docs</IconBadge>}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials(expert.name)}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{expert.name}</h3>
                  <div className="text-xs text-muted-foreground">{expert.team}</div>
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                {expert.contributions} source{expert.contributions === 1 ? "" : "s"}
              </div>
              <div className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{expert.doc_ids.map((id) => docs.get(id)?.title || id).join(" · ")}</div>
              <Button size="small" variant="outline" className="mt-4" onClick={() => notify(`Handed to ${expert.name} with context (demo: a Teams message in production)`)}>
                <Send size={13} /> Send with context
              </Button>
            </article>
          ))}
        </div>
        <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <BookOpen size={16} className="text-primary" /> Knowledge gaps, live
          </div>
          <p className="mb-5 text-xs leading-5 text-muted-foreground">Questions nobody has written an answer to, and knowledge that only lives with people.</p>
          <div className="space-y-4">
            {gaps.map((gap) => (
              <div key={gap.at} className="border-t border-border pt-4">
                <div className="text-xs font-semibold leading-5">&ldquo;{gap.question}&rdquo;</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Asked by {gap.asked_by} · routed to {gap.routed_to ?? "nobody yet"}
                </div>
              </div>
            ))}
            {chatOnly.map((gap, i) => (
              <div key={gap.id} className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold text-chat">0{i + 1}</span>
                  <div>
                    <div className="text-xs font-semibold capitalize leading-5">{topicLabel(gap.topic)}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                      {gap.owner.name} · {gap.owner.team}
                    </div>
                    <div className="mt-2 text-[11px] text-chat">{gap.doc_ids.length} informal sources, no official article</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md bg-success-soft px-4 py-3 text-xs leading-5 text-success-foreground">Good answers deserve a permanent home.</div>
        </aside>
      </div>
    </>
  );
}
