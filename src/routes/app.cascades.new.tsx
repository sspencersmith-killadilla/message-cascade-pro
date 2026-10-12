import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Paperclip, Plus, Send, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-org";
import { attachmentsQuery, cascadeQuery, membersQuery } from "@/lib/queries";
import { draftTalkingPoints, rewritePlain, sendCascade } from "@/lib/cascades.functions";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/app/cascades/new")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "New cascade — Cadence" }] }),
  component: Editor,
});

function Editor() {
  const org = useCurrentOrg();
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const existing = useQuery({ ...cascadeQuery(id ?? "none"), enabled: !!id });
  const existingFiles = useQuery({ ...attachmentsQuery(id ?? "none"), enabled: !!id });
  const members = useQuery(membersQuery(org.org_id));
  const send = useServerFn(sendCascade);
  const aiPoints = useServerFn(draftTalkingPoints);
  const aiRewrite = useServerFn(rewritePlain);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [allDepts, setAllDepts] = useState(true);
  const [depts, setDepts] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const c = existing.data;
    if (!c) return;
    setTitle(c.title);
    setMessage(c.message);
    setPoints(c.talking_points ?? []);
    setDeadline(c.deadline ?? "");
    setAllDepts(!c.audience_departments?.length);
    setDepts(c.audience_departments ?? []);
  }, [existing.data]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    for (const m of members.data ?? []) if (m.department) s.add(m.department);
    return [...s].sort();
  }, [members.data]);
  const managerCount = (members.data ?? []).filter((m) => m.role === "manager" && (allDepts || (m.department && depts.includes(m.department)))).length;

  async function save(andSend: boolean) {
    if (!title.trim() || message.trim().length < 10) { toast.error("Add a title and a message of at least 10 characters."); return; }
    setBusy(andSend ? "send" : "save");
    try {
      const row = {
        org_id: org.org_id,
        title: title.trim(),
        message: message.trim(),
        talking_points: points.map((p) => p.trim()).filter(Boolean),
        deadline: deadline || null,
        audience_departments: allDepts ? null : depts,
      };
      let cid = id;
      if (cid) {
        const { error } = await supabase.from("cascades").update(row).eq("id", cid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("cascades").insert({ ...row, created_by: (await supabase.auth.getUser()).data.user?.id ?? null }).select("id").single();
        if (error) throw error;
        cid = data.id;
      }
      for (const f of files) {
        const path = `${org.org_id}/${cid}/${Date.now()}-${f.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, f);
        if (upErr) throw upErr;
        await supabase.from("cascade_attachments").insert({ cascade_id: cid!, org_id: org.org_id, file_path: path, file_name: f.name });
      }
      if (andSend) {
        const r = await send({ data: { cascade_id: cid! } });
        toast.success(`Sent to ${r.recipients} managers`);
      } else toast.success("Draft saved");
      qc.invalidateQueries({ queryKey: ["cascades"] });
      qc.invalidateQueries({ queryKey: ["cascade", cid] });
      navigate({ to: "/app/cascades/$id", params: { id: cid! } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function rewrite() {
    setBusy("rewrite");
    try {
      const r = await aiRewrite({ data: { org_id: org.org_id, message } });
      setMessage(r.message);
      toast.success("Rewritten in plain language");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusy(null);
    }
  }
  async function genPoints() {
    setBusy("points");
    try {
      const r = await aiPoints({ data: { org_id: org.org_id, title, message } });
      setPoints(r.points);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusy(null);
    }
  }

  async function removeExisting(fid: string, path: string) {
    await supabase.storage.from("attachments").remove([path]);
    await supabase.from("cascade_attachments").delete().eq("id", fid);
    existingFiles.refetch();
  }

  return (
    <>
      <PageHeader title={id ? "Edit draft" : "New cascade"} subtitle="Write it once. Every manager gets it, shares it, and tells you how it landed." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-xl border bg-card p-6 shadow-soft">
          <div><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New benefits enrollment window" /></div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="m">Message</Label>
              <Button size="sm" variant="ghost" onClick={rewrite} disabled={message.length < 10 || !!busy}><Wand2 /> {busy === "rewrite" ? "Rewriting…" : "Make it plainer"}</Button>
            </div>
            <Textarea id="m" rows={10} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do teams need to know, and why?" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Talking points for managers</Label>
              <Button size="sm" variant="ghost" onClick={genPoints} disabled={message.length < 10 || !!busy}><Sparkles /> {busy === "points" ? "Drafting…" : "Draft with AI"}</Button>
            </div>
            <div className="mt-2 space-y-2">
              {points.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={p} onChange={(e) => setPoints(points.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button size="icon" variant="ghost" onClick={() => setPoints(points.filter((_, j) => j !== i))}><X /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setPoints([...points, ""])}><Plus /> Add point</Button>
            </div>
          </div>
          <div>
            <Label>Attachments</Label>
            <div className="mt-2 space-y-2">
              {(existingFiles.data ?? []).map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                  <span className="truncate"><Paperclip className="mr-2 inline h-4 w-4" />{f.file_name}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeExisting(f.id, f.file_path)}><Trash2 /></Button>
                </div>
              ))}
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                  <span className="truncate"><Paperclip className="mr-2 inline h-4 w-4" />{f.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X /></Button>
                </div>
              ))}
              <Input type="file" multiple onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-soft">
            <div><Label htmlFor="d">Share by</Label><Input id="d" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
            <div>
              <Label>Who gets it</Label>
              <label className="mt-2 flex items-center gap-2 text-sm"><Checkbox checked={allDepts} onCheckedChange={(v) => setAllDepts(!!v)} /> All managers</label>
              {!allDepts && (
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {departments.length === 0 && <p className="text-xs text-muted-foreground">No departments yet. Add them on the People page.</p>}
                  {departments.map((d) => (
                    <label key={d} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={depts.includes(d)} onCheckedChange={(v) => setDepts(v ? [...depts, d] : depts.filter((x) => x !== d))} /> {d}
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">{managerCount} manager{managerCount === 1 ? "" : "s"} will receive this.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => save(true)} disabled={!!busy || managerCount === 0}><Send /> {busy === "send" ? "Sending…" : "Save & send"}</Button>
            <Button variant="outline" onClick={() => save(false)} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save draft"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
