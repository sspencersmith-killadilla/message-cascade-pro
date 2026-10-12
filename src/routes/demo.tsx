import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, RotateCcw, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { completionStats, statsByDepartment } from "@/lib/cadence";
import { Brand } from "@/components/brand";
import { Bar, Stat, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Interactive demo — Cadence" },
      { name: "description", content: "Try Cadence hands-on: send a cascade as an admin, respond as a manager, nudge late teams and roll up feedback with AI. No sign-in needed." },
      { property: "og:title", content: "Interactive demo — Cadence" },
      { property: "og:description", content: "Send a cascade, respond as a manager, and see the feedback roll-up. No sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Demo,
});

type Rec = {
  name: string; department: string;
  acknowledged_at: string | null; shared_at: string | null;
  responded: boolean; method?: string | undefined; feedback?: string | undefined; questions?: string | undefined; nudged?: number | undefined;
};
type Cascade = { title: string; message: string; points: string; deadline: string; departments: string[] };

const MANAGERS: [string, string][] = [
  ["Maria Lopez", "Parks & Rec"], ["James Patel", "Parks & Rec"],
  ["Aisha Brown", "Public Works"], ["Tom Nguyen", "Public Works"],
  ["Sara Kim", "Library"], ["Diego Ramos", "Library"],
  ["Lena Fischer", "Finance"], ["Omar Haddad", "Finance"],
];
const DEPTS = Array.from(new Set(MANAGERS.map((m) => m[1])));
const METHODS = ["Team meeting", "Huddle", "Email", "One-on-ones"];
const SAMPLE_FEEDBACK = [
  ["Team likes the flexibility but field crews feel left out.", "How does this apply to on-site roles?"],
  ["Mostly positive. People want clarity on equipment.", "Is there a home-office stipend?"],
  ["Concern about meetings getting harder to schedule.", "Will there be core in-office days?"],
  ["Very supportive. A few asked about seasonal schedules.", "Can outdoor crews flex seasonally?"],
];
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const stamp = () => new Date().toISOString();

function Demo() {
  const [cascade, setCascade] = useState<Cascade | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [view, setView] = useState("admin");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l].slice(0, 30));

  const reset = () => { setCascade(null); setRecs([]); setLog([]); setView("admin"); };

  const send = (c: Cascade) => {
    const list = MANAGERS.filter(([, d]) => c.departments.length === 0 || c.departments.includes(d))
      .map(([name, department]) => ({ name, department, acknowledged_at: null, shared_at: null, responded: false }));
    setCascade(c); setRecs(list);
    addLog(`Sent “${c.title}” to ${list.length} managers — ${list.length} emails queued`);
    toast.success(`Sent to ${list.length} managers`);
  };

  const update = (name: string, patch: Partial<Rec>) => setRecs((rs) => rs.map((r) => (r.name === name ? { ...r, ...patch } : r)));

  const simulate = () => {
    let changed = 0;
    setRecs((rs) => rs.map((r, i) => {
      if (r.responded || Math.random() < 0.35) return r;
      changed++;
      if (!r.acknowledged_at) return { ...r, acknowledged_at: stamp() };
      if (!r.shared_at) return { ...r, shared_at: stamp(), method: METHODS[i % METHODS.length]! };
      const [feedback, questions] = SAMPLE_FEEDBACK[i % SAMPLE_FEEDBACK.length]!;
      return { ...r, responded: true, feedback, questions };
    }));
    addLog("A day passes — some managers made progress");
    if (changed === 0) toast("Nobody moved this time — try again");
  };

  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <Button asChild><Link to="/login" search={{ mode: "signup" }}>Start your own</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-2 text-sm text-highlight">
          <span>Interactive demo · sample organization “City of Riverbend”. Nothing is saved or emailed.</span>
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" /> Start over</Button>
        </div>

        {!cascade ? (
          <Compose onSend={send} />
        ) : (
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="admin">Admin view</TabsTrigger>
              <TabsTrigger value="manager">Manager view</TabsTrigger>
            </TabsList>
            <TabsContent value="admin">
              <AdminView cascade={cascade} recs={recs} onSimulate={simulate}
                onNudge={(names) => {
                  names.forEach((n) => update(n, { nudged: (recs.find((r) => r.name === n)?.nudged ?? 0) + 1 }));
                  addLog(`Nudged ${names.length} manager${names.length === 1 ? "" : "s"}`);
                  toast.success(`Nudged ${names.length}`);
                }} />
            </TabsContent>
            <TabsContent value="manager">
              <ManagerView cascade={cascade} recs={recs} onUpdate={(n, p, msg) => { update(n, p); addLog(msg); }} />
            </TabsContent>
          </Tabs>
        )}

        {log.length > 0 && (
          <div className="mt-6 rounded-xl border bg-card p-4 text-xs text-muted-foreground shadow-soft">
            <div className="mb-2 font-semibold text-primary">Activity</div>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </main>
    </div>
  );
}

function Compose({ onSend }: { onSend: (c: Cascade) => void }) {
  const [title, setTitle] = useState("New hybrid work policy");
  const [message, setMessage] = useState("Starting next month, staff in eligible roles may work remotely up to two days a week, in agreement with their manager. On-site roles will get added schedule flexibility. Please share this with your team and collect their questions.");
  const [points, setPoints] = useState("");
  const [deadline, setDeadline] = useState(inDays(5));
  const [departments, setDepartments] = useState<string[]>([]);
  const toggle = (d: string) => setDepartments((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));
  const count = MANAGERS.filter(([, d]) => departments.length === 0 || departments.includes(d)).length;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-soft">
      <h1 className="text-2xl text-primary">Step 1 · Write a cascade</h1>
      <p className="mt-1 text-sm text-muted-foreground">You're the admin. Edit anything, pick who gets it, then send.</p>
      <div className="mt-5 grid gap-4">
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Message</Label><Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <div>
          <div className="flex items-center justify-between"><Label>Talking points</Label>
            <Button size="sm" variant="outline" onClick={() => setPoints("• Up to two remote days a week for eligible roles\n• Agree your schedule with your manager\n• On-site roles get more schedule flexibility\n• Bring your questions — we'll answer them")}>
              <Wand2 className="mr-1 h-4 w-4" /> Draft with AI</Button>
          </div>
          <Textarea rows={4} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Optional" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Share by</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          <div><Label>Audience</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DEPTS.map((d) => (
                <Button key={d} size="sm" type="button" variant={departments.includes(d) ? "default" : "outline"} onClick={() => toggle(d)}>{d}</Button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{departments.length ? "Selected departments" : "All managers"} · {count} recipients</p>
          </div>
        </div>
        <div><Button disabled={!title.trim() || message.trim().length < 10} onClick={() => onSend({ title, message, points, deadline, departments })}>
          <Send className="mr-1 h-4 w-4" /> Send to {count} managers</Button></div>
      </div>
    </div>
  );
}

function AdminView({ cascade, recs, onSimulate, onNudge }: { cascade: Cascade; recs: Rec[]; onSimulate: () => void; onNudge: (names: string[]) => void }) {
  const s = completionStats(recs);
  const depts = statsByDepartment(recs);
  const overdue = cascade.deadline < inDays(0);
  const pending = recs.filter((r) => !r.shared_at);
  const responses = recs.filter((r) => r.responded);
  const [summary, setSummary] = useState<string[] | null>(null);
  const summaryFor = useMemo(() => responses.length, [summary]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">{cascade.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{cascade.departments.length ? cascade.departments.join(", ") : "All managers"} · Share by {cascade.deadline}{overdue ? " · overdue" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSimulate}>Fast-forward a day</Button>
          <Button variant="outline" disabled={!pending.length} onClick={() => onNudge(pending.map((r) => r.name))}><Bell className="mr-1 h-4 w-4" /> Nudge all pending</Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Managers" value={s.total} />
        <Stat label="Acknowledged" value={`${s.acknowledgedPct}%`} />
        <Stat label="Shared with team" value={`${s.sharedPct}%`} tone="accent" />
        <Stat label="Feedback" value={`${s.respondedPct}%`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-soft">
          <h3 className="mb-4 text-base text-primary">By department</h3>
          <div className="space-y-3">
            {depts.map((d) => (
              <div key={d.department} className="grid grid-cols-[120px_1fr_50px] items-center gap-3 text-sm">
                <span>{d.department}</span><Bar value={d.sharedPct} /><span className="text-right text-xs text-muted-foreground">{d.shared}/{d.total}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 divide-y text-sm">
            {recs.map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-2 py-2">
                <span>{r.name} <span className="text-xs text-muted-foreground">· {r.department}{r.method ? ` · ${r.method}` : ""}{r.nudged ? ` · nudged ×${r.nudged}` : ""}</span></span>
                <span className="flex items-center gap-2">
                  {!r.shared_at && <Button size="sm" variant="ghost" onClick={() => onNudge([r.name])}>Nudge</Button>}
                  <StatusPill status={r.shared_at ? "shared" : r.acknowledged_at ? "acknowledged" : "pending"} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base text-primary"><Sparkles className="h-4 w-4 text-accent" /> Team feedback</h3>
            <Button size="sm" disabled={!responses.length} onClick={() => setSummary(buildSummary(responses))}>Summarize with AI</Button>
          </div>
          {!responses.length && <p className="mt-3 text-sm text-muted-foreground">No feedback yet. Switch to the Manager view to reply, or fast-forward a day.</p>}
          {summary && (
            <div className="mt-4 grid gap-2 text-sm">
              {summary.map((t) => <div key={t} className="rounded-lg bg-secondary p-3">{t}</div>)}
              {summaryFor !== responses.length && <p className="text-xs text-muted-foreground">New feedback arrived — summarize again to include it.</p>}
            </div>
          )}
          <div className="mt-4 divide-y text-sm">
            {responses.map((r) => (
              <div key={r.name} className="py-2">
                <div className="text-xs text-muted-foreground">{r.department}</div>
                <div>{r.feedback}</div>
                {r.questions && <div className="text-muted-foreground">Q: {r.questions}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSummary(rs: Rec[]): string[] {
  const text = rs.map((r) => `${r.feedback} ${r.questions ?? ""}`.toLowerCase()).join(" ");
  const themes: string[] = [`Overview: ${rs.length} team${rs.length === 1 ? "" : "s"} responded across ${new Set(rs.map((r) => r.department)).size} department(s).`];
  if (/field|on-site|outdoor|crew/.test(text)) themes.push("Fairness for on-site roles — crews want to know how they benefit.");
  if (/equipment|stipend|laptop/.test(text)) themes.push("Equipment and stipends — questions about home-office costs.");
  if (/meeting|core|schedul/.test(text)) themes.push("Meeting norms — requests for core in-office days.");
  if (/positive|support|like|welcome/.test(text)) themes.push("Overall sentiment is positive.");
  const qs = rs.map((r) => r.questions).filter(Boolean);
  if (qs.length) themes.push(`Open questions: ${qs.join(" · ")}`);
  return themes;
}

function ManagerView({ cascade, recs, onUpdate }: { cascade: Cascade; recs: Rec[]; onUpdate: (name: string, p: Partial<Rec>, msg: string) => void }) {
  const [who, setWho] = useState(recs[0]?.name ?? "");
  const me = recs.find((r) => r.name === who);
  const [method, setMethod] = useState(METHODS[0]!);
  const [feedback, setFeedback] = useState("");
  const [questions, setQuestions] = useState("");

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <div className="mb-2 text-xs font-semibold text-primary">Act as…</div>
        {recs.map((r) => (
          <button key={r.name} onClick={() => { setWho(r.name); setFeedback(""); setQuestions(""); }}
            className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${r.name === who ? "bg-secondary text-primary" : "hover:bg-muted"}`}>
            {r.name}<div className="text-xs text-muted-foreground">{r.department}</div>
          </button>
        ))}
      </div>
      {me && (
        <div className="rounded-xl border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{me.name}'s inbox{me.nudged ? ` · ${me.nudged} reminder${me.nudged > 1 ? "s" : ""} received` : ""}</div>
              <h2 className="text-2xl text-primary">{cascade.title}</h2>
              <p className="text-sm text-muted-foreground">Share by {cascade.deadline}</p>
            </div>
            <StatusPill status={me.shared_at ? "shared" : me.acknowledged_at ? "acknowledged" : "pending"} />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm">{cascade.message}</p>
          {cascade.points && <div className="mt-4 rounded-lg bg-secondary p-3 text-sm whitespace-pre-wrap"><div className="mb-1 font-semibold text-primary">Talking points</div>{cascade.points}</div>}

          <div className="mt-6 space-y-4 border-t pt-4">
            {!me.acknowledged_at && (
              <Button variant="outline" onClick={() => onUpdate(me.name, { acknowledged_at: stamp() }, `${me.name} acknowledged`)}>Got it</Button>
            )}
            {!me.shared_at ? (
              <div className="flex flex-wrap items-end gap-2">
                <div><Label>How did you share it?</Label>
                  <div className="mt-1 flex flex-wrap gap-2">{METHODS.map((m) => (
                    <Button key={m} size="sm" variant={method === m ? "default" : "outline"} onClick={() => setMethod(m)}>{m}</Button>
                  ))}</div>
                </div>
                <Button onClick={() => onUpdate(me.name, { shared_at: stamp(), acknowledged_at: me.acknowledged_at ?? stamp(), method }, `${me.name} shared via ${method}`)}>Shared with my team</Button>
              </div>
            ) : <p className="text-sm text-muted-foreground">Shared via {me.method}.</p>}
            {me.shared_at && !me.responded && (
              <div className="grid gap-3">
                <div><Label>What did your team say?</Label><Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g. They like the flexibility but want clarity on equipment." /></div>
                <div><Label>Questions for leadership</Label><Input value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Optional" /></div>
                <div><Button disabled={feedback.trim().length < 3} onClick={() => onUpdate(me.name, { responded: true, feedback, questions }, `${me.name} sent feedback`)}>Send feedback</Button></div>
              </div>
            )}
            {me.responded && <p className="text-sm text-accent">Done — feedback sent. Check the Admin view to see it.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
