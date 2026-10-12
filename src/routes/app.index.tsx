import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCurrentOrg } from "@/hooks/use-org";
import { cascadesQuery, withResponded } from "@/lib/queries";
import { canSendCascades, completionStats, isOverdue } from "@/lib/cadence";
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
          {org.role === "manager" ? (
            <Button asChild><Link to="/app/inbox">Open my inbox</Link></Button>
          ) : (
            <Empty title="Nothing to do here yet" text="Your managers share cascades with you directly. Admins can make you a manager on the People page." />
          )}
        </div>
      </>
    );
  }

  const allRecipients = active.flatMap((c) => withResponded(c).map((r) => ({ ...r, deadline: c.deadline })));
  const overall = completionStats(allRecipients);
  const overdueCount = allRecipients.filter((r) => isOverdue(r.deadline, r.shared_at)).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={org.organizations?.name}
        actions={<Button asChild><Link to="/app/cascades/new"><Plus /> New cascade</Link></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active cascades" value={active.length} />
        <Stat label="Shared with teams" value={`${overall.sharedPct}%`} hint={`${overall.shared} of ${overall.total} managers`} tone="accent" />
        <Stat label="Feedback received" value={`${overall.respondedPct}%`} hint={`${overall.responded} replies`} />
        <Stat label="Overdue managers" value={overdueCount} tone={overdueCount ? "warning" : "default"} />
      </div>

      <h2 className="mb-3 mt-10 text-xl text-primary">Active cascades</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : active.length === 0 ? (
        <Empty title="No active cascades" text="Write your first message and send it to every manager." action={<Button asChild><Link to="/app/cascades/new">Create a cascade</Link></Button>} />
      ) : (
        <div className="space-y-3">
          {active.map((c) => {
            const s = completionStats(withResponded(c));
            return (
              <Link key={c.id} to="/app/cascades/$id" params={{ id: c.id }} className="block rounded-xl border bg-card p-5 shadow-soft transition hover:border-highlight">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-primary">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.deadline ? `Due ${c.deadline}` : "No deadline"}</div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Bar value={s.sharedPct} />
                  <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{s.shared}/{s.total} shared</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {sent.length > active.length && (
        <>
          <h2 className="mb-3 mt-10 text-xl text-primary">Completion over time</h2>
          <div className="rounded-xl border bg-card p-5 shadow-soft">
            {sent.slice(0, 10).map((c) => {
              const s = completionStats(withResponded(c));
              return (
                <div key={c.id} className="flex items-center gap-3 py-1.5 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{c.sent_at?.slice(0, 10)}</span>
                  <span className="w-48 shrink-0 truncate">{c.title}</span>
                  <Bar value={s.sharedPct} />
                  <StatusPill status={c.status} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
