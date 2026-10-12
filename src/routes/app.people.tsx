import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search, Trash2, Upload, UserPlus } from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-org";
import { membersQuery } from "@/lib/queries";
import { validateImport, type ValidatedRow } from "@/lib/cadence";
import { importPeople } from "@/lib/cascades.functions";
import { PageHeader, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/app/people")({
  head: () => ({ meta: [{ title: "People — Cadence" }] }),
  component: People,
});

const TEMPLATE = "Name,Email,Title,Department,Manager Email,Role\nAna Ruiz,ana@example.org,Director,Operations,,\nBen Cho,ben@example.org,Supervisor,Operations,ana@example.org,\n";

function People() {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const { data: members = [] } = useQuery(membersQuery(org.org_id));
  const doImport = useServerFn(importPeople);
  const [preview, setPreview] = useState<ValidatedRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["members", org.org_id] });

  async function onFile(file: File) {
    let rows: Record<string, unknown>[] = [];
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
      rows = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: "" }) : [];
    } else {
      rows = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true }).data;
    }
    if (rows.length === 0) { toast.error("No rows found in that file"); return; }
    setPreview(validateImport(rows));
  }

  async function confirmImport() {
    if (!preview) return;
    const good = preview.filter((r) => r.errors.length === 0);
    setBusy(true);
    try {
      const r = await doImport({
        data: {
          org_id: org.org_id,
          rows: good.map((g) => ({ full_name: g.full_name, email: g.email, title: g.title, department: g.department, manager_email: g.manager_email, role: g.role === "owner" ? "admin" : g.role })),
        },
      });
      toast.success(`Imported ${r.imported} people · ${r.invited} invites queued`);
      setPreview(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function setRole(id: string, role: "admin" | "manager" | "member") {
    const { error } = await supabase.from("org_members").update({ role }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function remove(id: string) {
    if (!confirm("Remove this person from your organization?")) return;
    const { error } = await supabase.from("org_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  const list = members.filter((m) => `${m.full_name} ${m.email} ${m.department} ${m.title}`.toLowerCase().includes(q.toLowerCase()));
  const nameByEmail = new Map(members.map((m) => [m.email, m.full_name ?? m.email]));

  return (
    <>
      <PageHeader
        title="People"
        subtitle={`${members.length} people · ${members.filter((m) => m.role === "manager").length} managers`}
        actions={
          <>
            <Button variant="ghost" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" })); a.download = "cadence-org-chart.csv"; a.click(); }}><Download /> Template</Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer"><Upload /> Import spreadsheet<input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} /></label>
            </Button>
            <Button onClick={() => setAdding(true)}><UserPlus /> Add person</Button>
          </>
        }
      />
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Reports to</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th /></tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3"><div className="font-medium">{m.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{m.email}{m.title ? ` · ${m.title}` : ""}</div></td>
                <td className="px-4 py-3">{m.department ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.manager_email ? nameByEmail.get(m.manager_email) ?? m.manager_email : "—"}</td>
                <td className="px-4 py-3">
                  {m.role === "owner" ? <span className="text-xs font-medium">Owner</span> : (
                    <Select value={m.role} onValueChange={(v) => setRole(m.id, v as "admin" | "manager" | "member")}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-4 py-3"><StatusPill status={m.status === "active" ? "shared" : "pending"} /><span className="sr-only">{m.status}</span></td>
                <td className="px-4 py-3 text-right">{m.role !== "owner" && <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 /></Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">Green = joined, amber = invited. Managers receive cascades; admins send them.</p>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Review import</DialogTitle></DialogHeader>
          {preview && (
            <>
              <p className="text-sm text-muted-foreground">
                {preview.filter((r) => !r.errors.length).length} ready · {preview.filter((r) => r.errors.length).length} with problems (skipped). Anyone listed as a manager becomes a manager.
              </p>
              <div className="max-h-96 overflow-auto rounded-md border text-sm">
                <table className="w-full">
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className={r.errors.length ? "bg-destructive/5" : ""}>
                        <td className="px-3 py-1.5">{r.full_name || "—"}</td>
                        <td className="px-3 py-1.5">{r.email}</td>
                        <td className="px-3 py-1.5">{r.department}</td>
                        <td className="px-3 py-1.5 capitalize">{r.role}</td>
                        <td className="px-3 py-1.5 text-xs text-destructive">{r.errors.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPreview(null)}>Cancel</Button>
                <Button disabled={busy || !preview.some((r) => !r.errors.length)} onClick={confirmImport}>{busy ? "Importing…" : "Import"}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddPerson open={adding} onClose={() => setAdding(false)} onDone={refresh} managers={members.filter((m) => m.role !== "member").map((m) => ({ email: m.email, name: m.full_name ?? m.email }))} />
    </>
  );
}

function AddPerson({ open, onClose, onDone, managers }: { open: boolean; onClose: () => void; onDone: () => void; managers: { email: string; name: string }[] }) {
  const org = useCurrentOrg();
  const doImport = useServerFn(importPeople);
  const [f, setF] = useState({ full_name: "", email: "", title: "", department: "", manager_email: "", role: "manager" as "admin" | "manager" | "member" });
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await doImport({ data: { org_id: org.org_id, rows: [{ ...f, manager_email: f.manager_email === "none" ? "" : f.manager_email }] } });
      toast.success("Person added and invited");
      setF({ ...f, full_name: "", email: "", title: "" });
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a person</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Name</Label><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reports to</Label>
              <Select value={f.manager_email || "none"} onValueChange={(v) => setF({ ...f, manager_email: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Nobody</SelectItem>{managers.map((m) => <SelectItem key={m.email} value={m.email}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as typeof f.role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>Add & invite</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
