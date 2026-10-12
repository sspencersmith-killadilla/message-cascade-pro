import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, LayoutDashboard, LogOut, Megaphone, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { OrgProvider, useOrg } from "@/hooks/use-org";
import { canSendCascades } from "@/lib/cadence";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Cadence" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);
  if (loading || !user) return <FullLoader />;
  return (
    <OrgProvider>
      <Gate />
    </OrgProvider>
  );
}

function FullLoader() {
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
}

function Gate() {
  const { loading, current } = useOrg();
  if (loading) return <FullLoader />;
  if (!current) return <Onboarding />;
  return <Shell />;
}

function Onboarding() {
  const { user } = useAuth();
  const { refetch, setOrgId } = useOrg();
  const [name, setName] = useState("");
  const [you, setYou] = useState((user?.user_metadata?.["full_name"] as string) ?? "");
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("create_organization", { _name: name, _full_name: you });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setOrgId(data as string);
    refetch();
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Brand className="mb-6" />
        <h1 className="text-2xl text-primary">Set up your organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Joining an existing organization? Ask an admin to add <strong>{user?.email}</strong> on their People page, then refresh.
        </p>
        <form onSubmit={create} className="mt-6 space-y-3">
          <div><Label htmlFor="org">Organization name</Label><Input id="org" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label htmlFor="you">Your name</Label><Input id="you" value={you} onChange={(e) => setYou(e.target.value)} required /></div>
          <Button type="submit" className="w-full" disabled={busy}>Create organization</Button>
        </form>
        <Button variant="ghost" className="mt-3 w-full" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    </div>
  );
}

function Shell() {
  const { current, memberships, setOrgId } = useOrg();
  const qc = useQueryClient();
  const admin = canSendCascades(current?.role);
  const nav = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, show: true, exact: true },
    { to: "/app/cascades", label: "Cascades", icon: Megaphone, show: admin },
    { to: "/app/inbox", label: "My inbox", icon: Inbox, show: current?.role === "manager" || admin },
    { to: "/app/people", label: "People", icon: Users, show: admin },
    { to: "/app/settings", label: "Settings", icon: Settings, show: admin },
  ] as const;
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Brand to="/app" className="mb-6 px-2" />
        {memberships.length > 1 && (
          <Select value={current!.org_id} onValueChange={(v) => { setOrgId(v); qc.invalidateQueries(); }}>
            <SelectTrigger className="mb-4"><SelectValue /></SelectTrigger>
            <SelectContent>
              {memberships.map((m) => <SelectItem key={m.org_id} value={m.org_id}>{m.organizations?.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <nav className="flex flex-1 flex-col gap-1">
          {nav.filter((n) => n.show).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-semibold text-primary" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t pt-4 text-xs text-muted-foreground">
          <div className="truncate font-medium text-foreground">{current?.organizations?.name}</div>
          <div className="truncate">{current?.email} · {current?.role}</div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={() => supabase.auth.signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Brand to="/app" />
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /></Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          {nav.filter((n) => n.show).map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm" activeProps={{ className: "bg-secondary font-semibold text-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
