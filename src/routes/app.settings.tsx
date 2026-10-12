import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg, useOrg } from "@/hooks/use-org";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Cadence" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const org = useCurrentOrg();
  const { refetch } = useOrg();
  const [name, setName] = useState(org.organizations?.name ?? "");
  const [days, setDays] = useState(org.organizations?.reminder_days_before ?? 2);
  useEffect(() => {
    setName(org.organizations?.name ?? "");
    setDays(org.organizations?.reminder_days_before ?? 2);
  }, [org.org_id]);

  const emails = useQuery({
    queryKey: ["email_log", org.org_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_log").select("*").eq("org_id", org.org_id).order("created_at", { ascending: false }).limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("organizations").update({ name: name.trim(), reminder_days_before: Math.max(0, Math.min(14, days)) }).eq("id", org.org_id);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    refetch();
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Organization details and reminder timing." />
      <form onSubmit={save} className="max-w-lg space-y-4 rounded-xl border bg-card p-6 shadow-soft">
        <div><Label htmlFor="n">Organization name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div>
          <Label htmlFor="d">Remind managers this many days before the deadline</Label>
          <Input id="d" type="number" min={0} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          <p className="mt-1 text-xs text-muted-foreground">Overdue notices go out the day after the deadline, and admins get a summary.</p>
        </div>
        <Button type="submit">Save</Button>
      </form>

      <h2 className="mb-3 mt-10 text-xl text-primary">Recent email notices</h2>
      <div className="overflow-hidden rounded-xl border bg-card text-sm shadow-soft">
        {(emails.data ?? []).length === 0 ? (
          <p className="p-5 text-muted-foreground">No emails yet.</p>
        ) : (
          emails.data!.map((e) => (
            <div key={e.id} className="flex justify-between gap-3 border-b px-5 py-2 last:border-b-0">
              <span className="truncate">{e.to_email}</span>
              <span className="text-muted-foreground">{e.kind.replace("_", " ")} · {e.status} · {e.created_at.slice(0, 16).replace("T", " ")}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
