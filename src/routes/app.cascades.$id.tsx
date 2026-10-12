import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Archive, BellRing, Pencil, Send, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-org";
import { cascadeQuery, withResponded } from "@/lib/queries";
import { completionStats, isOverdue, statsByDepartment } from "@/lib/cadence";
import { nudgeRecipients, sendCascade, summarizeFeedback, type CascadeSummary } from "@/lib/cascades.functions";
import { AttachmentList } from "@/components/attachment-list";
import { Bar, Empty, PageHeader, Stat, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/cascades/$id")({
  head: () => ({ meta: [{ title: "Cascade — Cadence" }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery(cascadeQuery(id));
  const nudge = useServerFn(nudgeRecipients);
  const send = useServerFn(sendCascade);
  const summarize = useServerFn(summarizeFeedback);
  const [busy, setBusy] = useState<string | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!c) return <Empty title="Cascade not found" action={<Button asChild variant="outline"><Link to="/app/cascades">Back</Link></Button>} />;

  const recips = withResponded(c);
  const s = completionStats(recips);
  const depts = statsByDepartment(recips);
  const overdue = recips.filter((r) => isOverdue(c.deadline, r.shared_at));
  const summary = c.ai_summary as CascadeSummary | null;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cascade", id] });
    qc.invalidateQueries({ queryKey: ["cascades"] });
  };

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    try {
      await fn();
      if (ok) toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Link to="/app/cascades" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Cascades</Link>
      <PageHeader
        title={c.title}
        subtitle={`${c.sent_at ? `Sent ${c.sent_at.slice(0, 10)}` : "Draft"}${c.deadline ? ` · Share by ${c.deadline}` : ""}${c.audience_departments?.length ? ` · ${c.audience_departments.join(", ")}` : " · All managers"}`}
        actions={
          <>
            <StatusPill status={c.status} />
            {c.status === "draft" && (
              <>
                <Button variant="outline" asChild><Link to="/app/cascades/new" search={{ id: c.id }}><Pencil /> Edit</Link></Button>
                <Button disabled={!!busy} onClick={() => run("send", async () => { const r = await send({ data: { cascade_id: c.id } }); toast.success(`Sent to ${r.recipients} managers`); })}><Send /> Send</Button>
              </>
            )}
            {c.status === "sent" && (
              <>
                <Button variant="outline" disabled={!!busy || s.shared === s.total} onClick={() => run("nudge", async () => { const r = await nudge({ data: { cascade_id: c.id } }); toast.success(`Nudged ${r.nudged} managers`); })}><BellRing /> Nudge all pending</Button>
                <Button variant="ghost" disabled={!!busy} onClick={() => run("close", async () => { const { error } = await supabase.from("cascades").update({ status: "closed" }).eq("id", c.id); if (error) throw error; }, "Cascade closed")}><Archive /> Close</Button>
              </>
            )}
            <Button
              variant="ghost"
              disabled={!!busy}
              onClick={async () => {
                if (!confirm("Delete this cascade and all its feedback?")) return;
                const { error } = await supabase.from("cascades").delete().eq("id", c.id);
                if (error) { toast.error(error.message); return; }
                qc.invalidateQueries({ queryKey: ["cascades"] });
                navigate({ to: "/app/cascades" });
              }}
            ><Trash2 /></Button>
          </>
        }
      />

      {c.status !== "draft" && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Managers" value={s.total} />
          <Stat label="Acknowledged" value={`${s.acknowledgedPct}%`} hint={`${s.acknowledged} of ${s.total}`} />
          <Stat label="Shared with team" value={`${s.sharedPct}%`} hint={`${s.shared} of ${s.total}`} tone="accent" />
          <Stat label="Overdue" value={overdue.length} tone={overdue.length ? "warning" : "default"} />
        </div>
      )}

      <Tabs defaultValue={c.status === "draft" ? "message" : "progress"}>
        <TabsList>
          <TabsTrigger value="message">Message</TabsTrigger>
          {c.status !== "draft" && <TabsTrigger value="progress">Progress</TabsTrigger>}
          {c.status !== "draft" && <TabsTrigger value="feedback">Feedback ({c.cascade_responses.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="message" className="mt-4 space-y-4 rounded-xl border bg-card p-6 shadow-soft">
          <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>
          {c.talking_points?.length > 0 && (
            <div>
              <h3 className="mb-2 text-base text-primary">Talking points</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">{c.talking_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
          <AttachmentList cascadeId={c.id} orgId={org.org_id} />
        </TabsContent>

        <TabsContent value="progress" className="mt-4 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <h3 className="mb-4 text-base text-primary">By department</h3>
            <div className="space-y-3">
              {depts.map((d) => (
                <div key={d.department} className="grid grid-cols-[140px_1fr_70px] items-center gap-3 text-sm">
                  <span className="truncate">{d.department}</span>
                  <Bar value={d.sharedPct} />
                  <span className="text-right text-xs text-muted-foreground">{d.shared}/{d.total}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
            {recips
              .slice()
              .sort((a, b) => Number(!!a.shared_at) - Number(!!b.shared_at))
              .map((r) => {
                const status = r.shared_at ? "shared" : isOverdue(c.deadline, r.shared_at) ? "overdue" : r.acknowledged_at ? "acknowledged" : "pending";
                return (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 border-b px-5 py-3 text-sm last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.org_members?.full_name ?? r.org_members?.email}</div>
                      <div className="text-xs text-muted-foreground">{r.org_members?.department ?? "—"}{r.share_method ? ` · shared via ${r.share_method}` : ""}{r.last_nudged_at ? ` · nudged ${r.last_nudged_at.slice(0, 10)}` : ""}</div>
                    </div>
                    {r.responded && <span className="text-xs text-accent">Replied</span>}
                    <StatusPill status={status} />
                    {!r.shared_at && c.status === "sent" && (
                      <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run("n" + r.id, async () => { await nudge({ data: { cascade_id: c.id, recipient_ids: [r.id] } }); }, "Nudge sent")}><BellRing /></Button>
                    )}
                  </div>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base text-primary">AI roll-up</h3>
              <Button size="sm" variant="outline" disabled={!!busy || c.cascade_responses.length === 0} onClick={() => run("sum", () => summarize({ data: { cascade_id: c.id } }), "Summary updated")}>
                <Sparkles /> {busy === "sum" ? "Summarizing…" : summary ? "Refresh summary" : "Summarize feedback"}
              </Button>
            </div>
            {summary ? (
              <div className="mt-4 space-y-4 text-sm">
                <p>{summary.overview}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {summary.themes.map((t, i) => (
                    <div key={i} className="rounded-lg bg-secondary p-3">
                      <div className="font-semibold text-primary">{t.title}{t.count ? <span className="ml-1 text-xs font-normal text-muted-foreground">· {t.count}</span> : null}</div>
                      <div className="text-muted-foreground">{t.detail}</div>
                    </div>
                  ))}
                </div>
                {summary.concerns.length > 0 && <div><div className="font-semibold text-primary">Concerns</div><ul className="list-disc pl-5">{summary.concerns.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                {summary.questions.length > 0 && <div><div className="font-semibold text-primary">Open questions to answer</div><ul className="list-disc pl-5">{summary.questions.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                <p className="text-xs text-muted-foreground">Generated {c.ai_generated_at?.slice(0, 16).replace("T", " ")}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Once managers reply, group their feedback into themes, concerns and questions.</p>
            )}
          </div>
          {c.cascade_responses.length === 0 ? (
            <Empty title="No feedback yet" text="Managers send feedback from their inbox after sharing with their team." />
          ) : (
            <div className="space-y-3">
              {c.cascade_responses.map((r) => {
                const who = c.cascade_recipients.find((x) => x.member_id === r.member_id)?.org_members;
                return (
                  <div key={r.id} className="rounded-xl border bg-card p-5 shadow-soft text-sm">
                    <div className="mb-2 text-xs text-muted-foreground">{who?.full_name ?? who?.email} · {who?.department ?? "—"} · {r.created_at.slice(0, 10)}</div>
                    <p className="whitespace-pre-wrap">{r.feedback}</p>
                    {r.questions && <p className="mt-2 whitespace-pre-wrap text-muted-foreground"><strong>Questions:</strong> {r.questions}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
