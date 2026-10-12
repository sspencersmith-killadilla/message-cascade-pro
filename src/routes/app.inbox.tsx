import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { toast } from "sonner";
import { Check, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-org";
import { cascadesQuery, type CascadeRow } from "@/lib/queries";
import { daysUntil, isOverdue } from "@/lib/cadence";
import { AttachmentList } from "@/components/attachment-list";
import { Empty, PageHeader, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({ meta: [{ title: "My inbox — Cadence" }] }),
  component: InboxPage,
});

function InboxPage() {
  const org = useCurrentOrg();
  const { data = [], isLoading } = useQuery(cascadesQuery(org.org_id));
  const [tab, setTab] = useState("todo");
  const mine = data
    .filter((c) => c.status !== "draft")
    .map((c) => ({ c, r: c.cascade_recipients.find((r) => r.member_id === org.id) }))
    .filter((x): x is { c: CascadeRow; r: CascadeRow["cascade_recipients"][number] } => !!x.r);
  const isOpen = (x: { c: CascadeRow; r: CascadeRow["cascade_recipients"][number] }) =>
    !x.r.shared_at || !x.c.cascade_responses.some((resp) => resp.member_id === org.id);
  const list = mine.filter((x) => (tab === "todo" ? isOpen(x) : !isOpen(x)));

  return (
    <>
      <PageHeader title="My inbox" subtitle="Messages to share with your team, and a place to send their feedback back up." />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="todo">Open ({mine.filter(isOpen).length})</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <Empty title={tab === "todo" ? "You're all caught up" : "Nothing shared yet"} text={mine.length === 0 ? "Cascades sent to you as a manager show up here." : undefined} />
      ) : (
        <div className="space-y-4">{list.map((x) => <InboxItem key={x.c.id} c={x.c} r={x.r} />)}</div>
      )}
    </>
  );
}

function InboxItem({ c, r }: { c: CascadeRow; r: CascadeRow["cascade_recipients"][number] }) {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const [method, setMethod] = useState(r.share_method ?? "Team meeting");
  const [feedback, setFeedback, clearFeedback] = useDraft(`cadence-fb-${r.id}`, "");
  const [questions, setQuestions, clearQuestions] = useDraft(`cadence-q-${r.id}`, "");
  const [busy, setBusy] = useState(false);
  const myResponses = c.cascade_responses.filter((x) => x.member_id === org.id);
  const refresh = () => qc.invalidateQueries({ queryKey: ["cascades", org.org_id] });
  const overdue = isOverdue(c.deadline, r.shared_at);

  async function update(patch: { acknowledged_at?: string; shared_at?: string; share_method?: string }, ok: string) {
    setBusy(true);
    const { error } = await supabase.from("cascade_recipients").update(patch).eq("id", r.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(ok);
    refresh();
  }

  async function sendFeedback() {
    if (!feedback.trim()) { toast.error("Add some feedback first"); return; }
    setBusy(true);
    const { error } = await supabase.from("cascade_responses").insert({ cascade_id: c.id, org_id: org.org_id, member_id: org.id, feedback: feedback.trim(), questions: questions.trim() || null });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setFeedback("");
    setQuestions("");
    clearFeedback();
    clearQuestions();
    toast.success("Feedback sent");
    refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg text-primary">{c.title}</h2>
          <p className="text-xs text-muted-foreground">
            Received {c.sent_at?.slice(0, 10)}
            {c.deadline && ` · Share by ${c.deadline}${!r.shared_at ? ` (${daysUntil(c.deadline) >= 0 ? `${daysUntil(c.deadline)} days left` : "late"})` : ""}`}
          </p>
        </div>
        <StatusPill status={r.shared_at ? "shared" : overdue ? "overdue" : r.acknowledged_at ? "acknowledged" : "pending"} />
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{c.message}</p>
      {c.talking_points?.length > 0 && (
        <div className="mt-4 rounded-lg bg-secondary p-4">
          <div className="mb-1 text-sm font-semibold text-primary">Talking points</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">{c.talking_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}
      <div className="mt-4"><AttachmentList cascadeId={c.id} orgId={org.org_id} /></div>

      <div className="mt-6 flex flex-wrap items-end gap-3 border-t pt-4">
        {!r.acknowledged_at && !r.shared_at && (
          <Button variant="outline" disabled={busy} onClick={() => update({ acknowledged_at: new Date().toISOString() }, "Marked as read")}><Eye /> Got it</Button>
        )}
        {!r.shared_at ? (
          <>
            <div className="w-48">
              <Label className="text-xs">How did you share it?</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Team meeting", "Huddle", "Email", "One-on-ones", "Chat"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={busy} onClick={() => update({ shared_at: new Date().toISOString(), acknowledged_at: r.acknowledged_at ?? new Date().toISOString(), share_method: method }, "Marked as shared")}><Check /> Shared with my team</Button>
          </>
        ) : (
          <p className="text-sm text-accent">Shared {r.shared_at.slice(0, 10)} via {r.share_method}</p>
        )}
      </div>

      <div className="mt-6 space-y-3 border-t pt-4">
        <h3 className="text-base text-primary">Team feedback</h3>
        {myResponses.map((x) => (
          <div key={x.id} className="rounded-lg bg-secondary p-3 text-sm">
            <p className="whitespace-pre-wrap">{x.feedback}</p>
            {x.questions && <p className="mt-1 text-muted-foreground">Questions: {x.questions}</p>}
          </div>
        ))}
        <div><Label htmlFor={`f-${c.id}`}>How did your team react?</Label><Textarea id={`f-${c.id}`} rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} /></div>
        <div><Label htmlFor={`q-${c.id}`}>Questions they asked (optional)</Label><Textarea id={`q-${c.id}`} rows={2} value={questions} onChange={(e) => setQuestions(e.target.value)} /></div>
        <Button variant="outline" disabled={busy} onClick={sendFeedback}>Send feedback</Button>
      </div>
    </div>
  );
}
