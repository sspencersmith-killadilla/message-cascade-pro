import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCurrentOrg } from "@/hooks/use-org";
import { cascadesQuery, withResponded } from "@/lib/queries";
import { completionStats } from "@/lib/cadence";
import { Bar, Empty, PageHeader, StatusPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/cascades/")({
  head: () => ({ meta: [{ title: "Cascades — Cadence" }] }),
  component: CascadeList,
});

function CascadeList() {
  const org = useCurrentOrg();
  const { data = [], isLoading } = useQuery(cascadesQuery(org.org_id));
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const list = data.filter(
    (c) => (tab === "all" || c.status === tab) && (c.title + " " + c.message).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader title="Cascades" subtitle="Drafts, active messages, and the archive." actions={<Button asChild><Link to="/app/cascades/new"><Plus /> New cascade</Link></Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Active</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search cascades" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <Empty title="No cascades found" text="Create one to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          {list.map((c) => {
            const s = completionStats(withResponded(c));
            return (
              <Link key={c.id} to="/app/cascades/$id" params={{ id: c.id }} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-secondary/50 md:grid-cols-[1fr_200px_120px_90px]">
                <div className="min-w-0">
                  <div className="truncate font-medium text-primary">{c.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.message}</div>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  {c.status !== "draft" && <><Bar value={s.sharedPct} /><span className="text-xs text-muted-foreground">{s.sharedPct}%</span></>}
                </div>
                <div className="hidden text-xs text-muted-foreground md:block">{c.deadline ? `Due ${c.deadline}` : "—"}</div>
                <StatusPill status={c.status === "sent" ? "sent" : c.status} />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
