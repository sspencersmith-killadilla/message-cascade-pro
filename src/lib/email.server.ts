// Server-only email helper. Records every notice in email_log; actual delivery
// is wired to Lovable Emails once a sending domain is configured for this project.

export type EmailKind = "cascade_sent" | "reminder" | "overdue" | "nudge" | "invite" | "admin_overdue";

export interface OutgoingEmail {
  org_id: string;
  cascade_id?: string | null;
  to: string;
  kind: EmailKind;
  subject: string;
  text: string;
}

export async function queueEmails(emails: OutgoingEmail[]) {
  if (emails.length === 0) return 0;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("email_log").insert(
    emails.map((e) => ({
      org_id: e.org_id,
      cascade_id: e.cascade_id ?? null,
      to_email: e.to,
      kind: e.kind,
      status: "queued",
    })),
  );
  if (error) console.error("email_log insert failed", error);
  return emails.length;
}

export function appUrl(path = "") {
  return `https://project--e5d3b7a3-a32d-4ea1-9169-ab5b6f5b2d35.lovable.app${path}`;
}
