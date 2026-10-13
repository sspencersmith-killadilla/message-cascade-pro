import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { OrgRole } from "@/lib/cadence";

export interface Membership {
  id: string;
  org_id: string;
  role: OrgRole;
  leads_team: boolean;
  full_name: string | null;
  email: string;
  department: string | null;
  organizations: { id: string; name: string; reminder_days_before: number } | null;
}

interface OrgState {
  memberships: Membership[];
  current: Membership | null;
  setOrgId: (id: string) => void;
  loading: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgState | null>(null);
const KEY = "cadence.org";

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgId, setOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    setOrgIdState(localStorage.getItem(KEY));
  }, []);

  const q = useQuery({
    queryKey: ["memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await supabase.rpc("claim_my_invites");
      const { data, error } = await supabase
        .from("org_members")
        .select("id, org_id, role, leads_team, full_name, email, department, organizations(id, name, reminder_days_before)")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Membership[];
    },
  });

  const memberships = q.data ?? [];
  const current = memberships.find((m) => m.org_id === orgId) ?? memberships[0] ?? null;

  const setOrgId = (id: string) => {
    localStorage.setItem(KEY, id);
    setOrgIdState(id);
  };

  return (
    <OrgContext.Provider value={{ memberships, current, setOrgId, loading: q.isLoading || !user, refetch: () => q.refetch() }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}

/** Use in pages under /app where an org is guaranteed. */
export function useCurrentOrg() {
  const { current } = useOrg();
  if (!current) throw new Error("No organization selected");
  return current;
}
