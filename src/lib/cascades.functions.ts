import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { queueEmails, appUrl, type OutgoingEmail } from "./email.server";
import { runAi, parseJson } from "./ai.server";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(ctx: Ctx, orgId: string) {
  const { data, error } = await ctx.supabase.rpc("is_org_admin", { _org: orgId, _uid: ctx.userId });
  if (error || !data) throw new Error("Only organization admins can do this");
}

async function assertMember(ctx: Ctx, orgId: string) {
  const { data, error } = await ctx.supabase.rpc("is_org_member", { _org: orgId, _uid: ctx.userId });
  if (error || !data) throw new Error("Not a member of this organization");
}

/** Sends a draft cascade: creates one recipient row per manager in the audience and queues emails. */
export const sendCascade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ cascade_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: c, error } = await ctx.supabase.from("cascades").select("*").eq("id", data.cascade_id).single();
    if (error || !c) throw new Error("Cascade not found");
    await assertAdmin(ctx, c.org_id);
    if (c.status !== "draft") throw new Error("This cascade was already sent");

    let q = ctx.supabase.from("org_members").select("id, email, full_name, department").eq("org_id", c.org_id).eq("role", "manager");
    if (c.audience_departments && c.audience_departments.length > 0) q = q.in("department", c.audience_departments);
    const { data: managers, error: mErr } = await q;
    if (mErr) throw new Error(mErr.message);
    if (!managers || managers.length === 0) throw new Error("No managers match this audience. Add managers on the People page first.");

    const { error: rErr } = await ctx.supabase.from("cascade_recipients").insert(
      managers.map((m: { id: string }) => ({ cascade_id: c.id, org_id: c.org_id, member_id: m.id })),
    );
    if (rErr) throw new Error(rErr.message);
    const { error: uErr } = await ctx.supabase.from("cascades").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", c.id);
    if (uErr) throw new Error(uErr.message);

    const emails: OutgoingEmail[] = managers.map((m: { email: string; full_name: string | null }) => ({
      org_id: c.org_id,
      cascade_id: c.id,
      to: m.email,
      kind: "cascade_sent",
      subject: `New cascade: ${c.title}`,
      text: `Hi ${m.full_name ?? ""}, please share "${c.title}" with your team${c.deadline ? ` by ${c.deadline}` : ""}. ${appUrl("/app/inbox")}`,
    }));
    await queueEmails(emails);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_log").insert({ org_id: c.org_id, actor_id: ctx.userId, action: "cascade_sent", entity_id: c.id });
    return { recipients: managers.length };
  });

/** Nudge managers who haven't shared yet. */
export const nudgeRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ cascade_id: z.string().uuid(), recipient_ids: z.array(z.string().uuid()).max(500).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: c } = await ctx.supabase.from("cascades").select("id, org_id, title, deadline").eq("id", data.cascade_id).single();
    if (!c) throw new Error("Cascade not found");
    await assertAdmin(ctx, c.org_id);
    let q = ctx.supabase
      .from("cascade_recipients")
      .select("id, org_members(email, full_name)")
      .eq("cascade_id", c.id)
      .is("shared_at", null);
    if (data.recipient_ids?.length) q = q.in("id", data.recipient_ids);
    const { data: rs } = await q;
    const list = (rs ?? []) as { id: string; org_members: { email: string; full_name: string | null } }[];
    await queueEmails(
      list.map((r) => ({
        org_id: c.org_id,
        cascade_id: c.id,
        to: r.org_members.email,
        kind: "nudge" as const,
        subject: `Reminder: share "${c.title}" with your team`,
        text: `Friendly nudge to share "${c.title}"${c.deadline ? ` by ${c.deadline}` : ""}. ${appUrl("/app/inbox")}`,
      })),
    );
    if (list.length) {
      await ctx.supabase.from("cascade_recipients").update({ last_nudged_at: new Date().toISOString() }).in("id", list.map((r) => r.id));
    }
    return { nudged: list.length };
  });

const importRow = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  title: z.string().max(200).optional().default(""),
  department: z.string().max(200).optional().default(""),
  manager_email: z.string().max(320).optional().default(""),
  role: z.enum(["admin", "manager", "member"]),
});

/** Import or update people from the org chart spreadsheet and queue invites for new people. */
export const importPeople = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ org_id: z.string().uuid(), rows: z.array(importRow).min(1).max(5000) }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx, data.org_id);
    const { data: existing } = await ctx.supabase.from("org_members").select("email, role").eq("org_id", data.org_id);
    const existingMap = new Map<string, string>((existing ?? []).map((e: { email: string; role: string }) => [e.email, e.role]));
    const rows = data.rows.map((r) => {
      const email = r.email.toLowerCase();
      const prev = existingMap.get(email);
      return {
        org_id: data.org_id,
        email,
        full_name: r.full_name,
        title: r.title || null,
        department: r.department || null,
        manager_email: r.manager_email?.toLowerCase() || null,
        // never demote the owner via import
        role: prev === "owner" ? "owner" : r.role,
      };
    });
    const { error } = await ctx.supabase.from("org_members").upsert(rows, { onConflict: "org_id,email" });
    if (error) throw new Error(error.message);
    const { data: org } = await ctx.supabase.from("organizations").select("name").eq("id", data.org_id).single();
    const newOnes = rows.filter((r) => !existingMap.has(r.email));
    await queueEmails(
      newOnes.map((r) => ({
        org_id: data.org_id,
        to: r.email,
        kind: "invite" as const,
        subject: `You're invited to ${org?.name ?? "your organization"} on Cadence`,
        text: `Sign up with this email to join: ${appUrl("/login")}`,
      })),
    );
    // link anyone who already has an account
    return { imported: rows.length, invited: newOnes.length };
  });

const summarySchema = z.object({
  overview: z.string(),
  themes: z.array(z.object({ title: z.string(), detail: z.string(), count: z.number().optional() })),
  concerns: z.array(z.string()),
  questions: z.array(z.string()),
});
export type CascadeSummary = z.infer<typeof summarySchema>;

/** Roll up all team feedback into themes. Admin-only. */
export const summarizeFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ cascade_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: c } = await ctx.supabase.from("cascades").select("id, org_id, title, message").eq("id", data.cascade_id).single();
    if (!c) throw new Error("Cascade not found");
    await assertAdmin(ctx, c.org_id);
    const { data: rs } = await ctx.supabase
      .from("cascade_responses")
      .select("feedback, questions, org_members(department)")
      .eq("cascade_id", c.id);
    if (!rs || rs.length === 0) throw new Error("No feedback yet to summarize");
    const body = rs
      .map((r: any, i: number) => `#${i + 1} [${r.org_members?.department ?? "—"}] Feedback: ${r.feedback}${r.questions ? `\nQuestions: ${r.questions}` : ""}`)
      .join("\n\n");
    const text = await runAi(
      "You analyze team feedback on an organizational announcement. Reply ONLY with a JSON object: {\"overview\": string (2-3 sentences), \"themes\": [{\"title\": string, \"detail\": string, \"count\": number}], \"concerns\": string[], \"questions\": string[] (distinct open questions leadership should answer)}. Be concise, neutral, and never name individuals.",
      `Announcement: ${c.title}\n${c.message}\n\nFeedback from managers:\n${body}`,
    );
    const summary = summarySchema.parse(parseJson(text));
    await ctx.supabase.from("cascades").update({ ai_summary: summary, ai_generated_at: new Date().toISOString() }).eq("id", c.id);
    return summary;
  });

/** Draft talking points managers can use in team meetings. */
export const draftTalkingPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ org_id: z.string().uuid(), title: z.string().max(300), message: z.string().min(10).max(20000) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx, data.org_id);
    const text = await runAi(
      'You help leaders cascade messages through managers. Reply ONLY with JSON: {"points": string[]} — 3 to 6 short talking points a manager can say out loud to their team, plain language, each under 25 words.',
      `Title: ${data.title}\n\n${data.message}`,
    );
    return z.object({ points: z.array(z.string()) }).parse(parseJson(text));
  });

/** Rewrite the main message in plain, clear language. */
export const rewritePlain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ org_id: z.string().uuid(), message: z.string().min(10).max(20000) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx, data.org_id);
    const text = await runAi(
      'Rewrite organizational announcements in clear, warm, plain language (about an 8th-grade reading level). Keep every fact, date, and commitment. Reply ONLY with JSON: {"message": string}.',
      data.message,
    );
    return z.object({ message: z.string() }).parse(parseJson(text));
  });

/** Signed URL for an attachment (any org member). */
export const attachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ org_id: z.string().uuid(), path: z.string().max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertMember(ctx, data.org_id);
    if (!data.path.startsWith(`${data.org_id}/`)) throw new Error("Invalid file");
    const { data: s, error } = await ctx.supabase.storage.from("attachments").createSignedUrl(data.path, 600);
    if (error) throw new Error(error.message);
    return { url: s.signedUrl as string };
  });
