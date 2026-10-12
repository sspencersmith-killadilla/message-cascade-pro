import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CascadeRow {
  id: string;
  org_id: string;
  title: string;
  message: string;
  talking_points: string[];
  deadline: string | null;
  status: string;
  audience_departments: string[] | null;
  ai_summary: unknown;
  ai_generated_at: string | null;
  sent_at: string | null;
  created_at: string;
  cascade_recipients: {
    id: string;
    member_id: string;
    acknowledged_at: string | null;
    shared_at: string | null;
    share_method: string | null;
    last_nudged_at: string | null;
    org_members: { full_name: string | null; email: string; department: string | null } | null;
  }[];
  cascade_responses: { id: string; member_id: string; feedback: string; questions: string | null; created_at: string }[];
}

const SELECT =
  "*, cascade_recipients(id, member_id, acknowledged_at, shared_at, share_method, last_nudged_at, org_members(full_name, email, department)), cascade_responses(id, member_id, feedback, questions, created_at)";

export const cascadesQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["cascades", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("cascades").select(SELECT).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CascadeRow[];
    },
  });

export const cascadeQuery = (id: string) =>
  queryOptions({
    queryKey: ["cascade", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cascades").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as CascadeRow | null;
    },
  });

export const attachmentsQuery = (cascadeId: string) =>
  queryOptions({
    queryKey: ["attachments", cascadeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("cascade_attachments").select("*").eq("cascade_id", cascadeId);
      if (error) throw error;
      return data ?? [];
    },
  });

export const membersQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_members").select("*").eq("org_id", orgId).order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

export function withResponded(c: CascadeRow) {
  const responders = new Set(c.cascade_responses.map((r) => r.member_id));
  return c.cascade_recipients.map((r) => ({ ...r, responded: responders.has(r.member_id), department: r.org_members?.department ?? null }));
}
