import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { needsReminder, isOverdue } from "@/lib/cadence";
import { queueEmails, appUrl, type OutgoingEmail } from "@/lib/email.server";

// Daily job: pre-deadline reminders, overdue notices, and admin overdue alerts.
export const Route = createFileRoute("/api/public/hooks/cadence-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows, error } = await supabaseAdmin
          .from("cascade_recipients")
          .select(
            "id, org_id, shared_at, reminder_sent_at, overdue_sent_at, org_members(email, full_name), cascades!inner(id, title, deadline, status, organizations(reminder_days_before))",
          )
          .is("shared_at", null)
          .eq("cascades.status", "sent")
          .not("cascades.deadline", "is", null)
          .limit(5000);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const emails: OutgoingEmail[] = [];
        const reminded: string[] = [];
        const overdue: string[] = [];
        const overdueByCascade = new Map<string, { org_id: string; title: string; count: number }>();
        for (const r of (rows ?? []) as any[]) {
          const c = r.cascades;
          const days = c.organizations?.reminder_days_before ?? 2;
          if (needsReminder(c.deadline, r.shared_at, r.reminder_sent_at, days)) {
            reminded.push(r.id);
            emails.push({ org_id: r.org_id, cascade_id: c.id, to: r.org_members.email, kind: "reminder", subject: `Due ${c.deadline}: ${c.title}`, text: `Please share "${c.title}" with your team by ${c.deadline}. ${appUrl("/app/inbox")}` });
          } else if (isOverdue(c.deadline, r.shared_at) && !r.overdue_sent_at) {
            overdue.push(r.id);
            emails.push({ org_id: r.org_id, cascade_id: c.id, to: r.org_members.email, kind: "overdue", subject: `Overdue: ${c.title}`, text: `"${c.title}" was due ${c.deadline}. Please share it and mark it done. ${appUrl("/app/inbox")}` });
            const e = overdueByCascade.get(c.id) ?? { org_id: r.org_id, title: c.title, count: 0 };
            e.count++;
            overdueByCascade.set(c.id, e);
          }
        }
        for (const [cid, info] of overdueByCascade) {
          const { data: admins } = await supabaseAdmin.from("org_members").select("email").eq("org_id", info.org_id).in("role", ["owner", "admin"]);
          for (const a of admins ?? []) {
            emails.push({ org_id: info.org_id, cascade_id: cid, to: a.email, kind: "admin_overdue", subject: `${info.count} managers overdue on "${info.title}"`, text: `See progress: ${appUrl(`/app/cascades/${cid}`)}` });
          }
        }
        await queueEmails(emails);
        const now = new Date().toISOString();
        if (reminded.length) await supabaseAdmin.from("cascade_recipients").update({ reminder_sent_at: now }).in("id", reminded);
        if (overdue.length) await supabaseAdmin.from("cascade_recipients").update({ overdue_sent_at: now }).in("id", overdue);
        return Response.json({ reminders: reminded.length, overdue: overdue.length });
      },
    },
  },
});
