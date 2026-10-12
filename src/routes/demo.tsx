import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { completionStats, statsByDepartment } from "@/lib/cadence";
import { Brand } from "@/components/brand";
import { Bar, Stat, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live demo — Cadence" },
      { name: "description", content: "Explore a sample organization in Cadence: a cascade, manager progress by department, and an AI feedback roll-up. No sign-in needed." },
      { property: "og:title", content: "Live demo — Cadence" },
      { property: "og:description", content: "See a sample cascade, manager progress, and AI feedback roll-up. No sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Demo,
});

const now = new Date().toISOString();
const R = (name: string, department: string, shared: boolean, ack: boolean, responded: boolean, method?: string) => ({
  name, department, shared_at: shared ? now : null, acknowledged_at: ack || shared ? now : null, responded, method,
});
const recipients = [
  R("Maria Lopez", "Parks & Rec", true, true, true, "Team meeting"),
  R("James Patel", "Parks & Rec", true, true, false, "Huddle"),
  R("Aisha Brown", "Public Works", true, true, true, "Email"),
  R("Tom Nguyen", "Public Works", false, true, false),
  R("Sara Kim", "Library", true, true, true, "Team meeting"),
  R("Diego Ramos", "Library", false, false, false),
  R("Lena Fischer", "Finance", true, true, true, "One-on-ones"),
  R("Omar Haddad", "Finance", false, false, false),
];

function Demo() {
  const s = completionStats(recipients);
  const depts = statsByDepartment(recipients);
  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <Button asChild><Link to="/login" search={{ mode: "signup" }}>Start your own</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-6 rounded-lg bg-secondary px-4 py-2 text-sm text-highlight">Demo · sample organization “City of Riverbend”. Nothing here is saved.</div>
        <h1 className="text-3xl text-primary">New hybrid work policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sent to all managers · Share by Friday</p>
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
              {recipients.map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2">
                  <span>{r.name} <span className="text-xs text-muted-foreground">· {r.department}{r.method ? ` · ${r.method}` : ""}</span></span>
                  <StatusPill status={r.shared_at ? "shared" : r.acknowledged_at ? "acknowledged" : "pending"} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 text-base text-primary"><Sparkles className="h-4 w-4 text-accent" /> AI roll-up</h3>
            <p className="mt-3 text-sm">Teams broadly welcome the flexibility. Field crews want clarity on how the policy applies to roles that can't work remotely, and several teams asked about equipment.</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                ["Fairness for field roles", "Public Works and Parks crews asked how on-site roles benefit."],
                ["Equipment and stipends", "Questions about laptops, monitors, and internet costs."],
                ["Meeting norms", "Requests for core in-office days to keep collaboration easy."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg bg-secondary p-3"><div className="font-semibold text-primary">{t}</div><div className="text-muted-foreground">{d}</div></div>
              ))}
            </div>
            <div className="mt-4 text-sm"><div className="font-semibold text-primary">Open questions</div>
              <ul className="list-disc pl-5"><li>Will there be a stipend for home office setup?</li><li>Can schedules flex seasonally for outdoor crews?</li></ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
