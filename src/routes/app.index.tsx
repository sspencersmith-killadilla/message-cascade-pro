import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus } from "lucide-react";
import { Bar as RBar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCurrentOrg } from "@/hooks/use-org";
import { cascadesQuery, withResponded } from "@/lib/queries";
import { canSendCascades, isCascadeRecipientRole, completionStats, isOverdue, statsByDepartment } from "@/lib/cadence";
import { Bar, Empty, PageHeader, Stat, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Cadence" }] }),
  component: Dashboard,
});

function Dashboard() {
  const org = useCurrentOrg();
  const admin = canSendCascades(org.role);
  const { data = [], isLoading } = useQuery(cascadesQuery(org.org_id));
  const sent = data.filter((c) => c.status !== "draft");
  const active = sent.filter((c) => c.status === "sent");

  if (!admin) {
    const mine = sent.flatMap((c) => c.cascade_recipients.filter((r) => r.member_id === org.id).map((r) => ({ c, r })));
    const todo = mine.filter((x) => !x.r.shared_at);
    return (
      <>
        <PageHeader title={`Hi ${org.full_name?.split(" ")[0] ?? "there"}`} subtitle={org.organizations?.name} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Waiting on you" value={todo.length} tone={todo.length ? "warning" : "accent"} />
          <Stat label="Overdue" value={todo.filter((x) => isOverdue(x.c.deadline, x.r.shared_at)).length} />
          <Stat label="Shared all-time" value={mine.length - todo.length} tone="accent" />
        </div>
        <div className="mt-6">
          {isCascadeRecipientRole(org.role, org.leads_team) ? (
            <Button asChild><Link to="/app/inbox">Open my inbox</Link></Button>
          ) : (
            <Empty title="Nothing to do here yet" text="Your managers share cascades with you directly. Admins can make you a manager on the People page." />
          )}
        </div>
      </>
    );
  }

  const allRecipients = active.flatMap((c) => withResponded(c).map((r) => ({ ...r, deadline: c.deadline, cascade: c })));
  const overall = completionStats(allRecipients);
  const overdue = allRecipients.filter((r) => isOverdue(r.deadline, r.shared_at));
  const drafts = data.filter((c) => c.status === "draft");
  const needsSummary = sent.filter((c) => c.cascade_responses.length > 0 && (!c.ai_generated_at || c.cascade_responses.some((r) => r.created_at > c.ai_generated_at!)));
  const depts = statsByDepartment(allRecipients).sort((a, b) => a.sharedPct - b.sharedPct);
  const dueSoon = active.filter((c) => c.deadline && !isOverdue(c.deadline, null) && c.deadline <= new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));
  const trend = [...sent].reverse().slice(-10).map((c) => {
    const s = completionStats(withResponded(c));
    return { name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title, Shared: s.sharedPct, Feedback: s.respondedPct };
  });
  const activity = sent
    .flatMap((c) => [
      ...c.cascade_recipients.filter((r) => r.shared_at).map((r) => ({ at: r.shared_at!, text: `${r.org_members?.full_name ?? r.org_members?.email} shared “${c.title}”`, id: c.id })),
      ...c.cascade_responses.map((r) => ({ at: r.created_at, text: `${c.cascade_recipients.find((x) => x.member_id === r.member_id)?.org_members?.full_name ?? "A manager"} sent feedback on “${c.title}”`, id: c.id })),
    ])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={org.organizations?.name}
        actions={<Button asChild><Link to="/app/cascades/new"><Plus /> New cascade</Link></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active cascades" value={active.length} hint={`${drafts.length} draft${drafts.length === 1 ? "" : "s"}`} />
        <Stat label="Shared with teams" value={`${overall.sharedPct}%`} hint={`${overall.shared} of ${overall.total} managers`} tone="accent" />
        <Stat label="Feedback received" value={`${overall.respondedPct}%`} hint={`${overall.responded} replies`} />
        <Stat label="Overdue managers" value={overdue.length} tone={overdue.length ? "warning" : "default"} />
      </div>

      {isLoading ? <p className="mt-8 text-muted-foreground">Loading…</p> : (
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-xl text-primary">Active cascades</h2>
            {active.length === 0 ? (
              <Empty title="No active cascades" text="Write your first message and send it to every manager." action={<Button asChild><Link to="/app/cascades/new">Create a cascade</Link></Button>} />
            ) : (
              <div className="space-y-3">
                {active.map((c) => {
                  const s = completionStats(withResponded(c));
                  const late = withResponded(c).filter((r) => isOverdue(c.deadline, r.shared_at)).length;
                  return (
                    <Link key={c.id} to="/app/cascades/$id" params={{ id: c.id }} className="block rounded-xl border bg-card p-5 shadow-soft transition hover:border-highlight">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-primary">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.deadline ? `Due ${c.deadline}` : "No deadline"}{late ? ` · ${late} late` : ""}</div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <div><div className="mb-1">Acknowledged {s.acknowledgedPct}%</div><Bar value={s.acknowledgedPct} /></div>
                        <div><div className="mb-1">Shared {s.shared}/{s.total}</div><Bar value={s.sharedPct} /></div>
                        <div><div className="mb-1">Feedback {s.respondedPct}%</div><Bar value={s.respondedPct} /></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {trend.length > 1 && (
            <section className="rounded-xl border bg-card p-5 shadow-soft">
              <h2 className="mb-3 text-base text-primary">Completion over time</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Legend />
                    <RBar dataKey="Shared" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <RBar dataKey="Feedback" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {depts.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-soft">
              <h2 className="mb-3 text-base text-primary">Departments (active cascades)</h2>
              <div className="space-y-2">
                {depts.map((d) => (
                  <div key={d.department} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm">
                    <span className="truncate">{d.department}</span><Bar value={d.sharedPct} /><span className="text-right text-xs text-muted-foreground">{d.sharedPct}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 flex items-center gap-2 text-base text-primary"><AlertTriangle className="h-4 w-4" /> Needs attention</h2>
            {overdue.length + dueSoon.length + needsSummary.length + drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overdue.slice(0, 6).map((r) => (
                  <li key={r.id}><Link to="/app/cascades/$id" params={{ id: r.cascade.id }} className="hover:underline"><span className="font-medium text-destructive">Late:</span> {r.org_members?.full_name ?? r.org_members?.email} · {r.cascade.title}</Link></li>
                ))}
                {overdue.length > 6 && <li className="text-xs text-muted-foreground">+{overdue.length - 6} more late managers</li>}
                {dueSoon.map((c) => <li key={c.id}><Link to="/app/cascades/$id" params={{ id: c.id }} className="hover:underline"><span className="font-medium">Due soon:</span> {c.title} ({c.deadline})</Link></li>)}
                {needsSummary.map((c) => <li key={c.id}><Link to="/app/cascades/$id" params={{ id: c.id }} className="hover:underline"><span className="font-medium text-accent">New feedback:</span> {c.title}</Link></li>)}
                {drafts.map((c) => <li key={c.id}><Link to="/app/cascades/$id" params={{ id: c.id }} className="hover:underline"><span className="font-medium text-muted-foreground">Draft:</span> {c.title}</Link></li>)}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-base text-primary">Recent activity</h2>
            {activity.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet.</p> : (
              <ul className="space-y-2 text-sm">
                {activity.map((a, i) => (
                  <li key={i}><Link to="/app/cascades/$id" params={{ id: a.id }} className="hover:underline">{a.text}</Link>
                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div></li>
                ))}
              </ul>
            )}
          </section>

          {sent.length > active.length && (
            <section className="rounded-xl border bg-card p-5 shadow-soft">
              <h2 className="mb-3 text-base text-primary">Recently closed</h2>
              {sent.filter((c) => c.status !== "sent").slice(0, 5).map((c) => (
                <Link key={c.id} to="/app/cascades/$id" params={{ id: c.id }} className="flex items-center justify-between gap-2 py-1 text-sm hover:underline">
                  <span className="truncate">{c.title}</span><StatusPill status={c.status} />
                </Link>
              ))}
            </section>
          )}
        </aside>
      </div>
      )}
    </>
  );
}
