// Server-only email helper. Every notice is logged in email_log, then delivered
// through Lovable's managed email API (sender: notify.cadence.civicplexus.org).

export type EmailKind = "cascade_sent" | "reminder" | "overdue" | "nudge" | "invite" | "admin_overdue";

export interface OutgoingEmail {
  org_id: string;
  cascade_id?: string | null;
  to: string;
  kind: EmailKind;
  subject: string;
  text: string;
}

const CTA_LABEL: Record<EmailKind, string> = {
  cascade_sent: "Open my inbox",
  reminder: "Open my inbox",
  overdue: "Open my inbox",
  nudge: "Open my inbox",
  invite: "Join Cadence",
  admin_overdue: "See progress",
};

/** Splits a trailing link off the plain text so it can become a button. */
export function splitLink(text: string): { body: string; url?: string } {
  const m = text.match(/\s*(https?:\/\/\S+)\s*$/);
  if (!m) return { body: text };
  return { body: text.slice(0, m.index).trim(), url: m[1] };
}

export async function queueEmails(emails: OutgoingEmail[]) {
  if (emails.length === 0) return 0;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  const { data: rows, error } = await supabaseAdmin
    .from("email_log")
    .insert(emails.map((e) => ({ org_id: e.org_id, cascade_id: e.cascade_id ?? null, to_email: e.to, kind: e.kind, status: "queued" })))
    .select("id");
  if (error) console.error("email_log insert failed", error);

  let sent = 0;
  for (let i = 0; i < emails.length; i++) {
    const e = emails[i]!;
    const logId = rows?.[i]?.id;
    const { body, url } = splitLink(e.text);
    let status = "sent";
    try {
      const res = await sendTemplateEmail("cadence-notice", e.to, {
        templateData: { subject: e.subject, heading: e.subject, body, ctaUrl: url, ctaLabel: CTA_LABEL[e.kind] },
        idempotencyKey: `cadence-notice-${logId ?? crypto.randomUUID()}`,
      });
      if (res.sent) sent++;
      else status = "suppressed";
    } catch (err) {
      status = "failed";
      console.error("email send failed", e.kind, err);
    }
    if (logId) await supabaseAdmin.from("email_log").update({ status }).eq("id", logId);
  }
  return sent;
}

export function appUrl(path = "") {
  return `https://cadence.civicplexus.org${path}`;
}
