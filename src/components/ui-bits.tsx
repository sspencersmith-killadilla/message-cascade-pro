import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string | undefined; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl text-primary md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "accent" | "warning" | "default" }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-serif text-3xl font-bold", tone === "accent" ? "text-accent" : tone === "warning" ? "text-warning" : "text-primary")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string | undefined; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <h3 className="text-lg text-primary">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground",
    sent: "bg-accent/15 text-accent",
    closed: "bg-primary/10 text-primary",
    overdue: "bg-destructive/10 text-destructive",
    shared: "bg-accent/15 text-accent",
    pending: "bg-warning/20 text-warning-foreground",
    acknowledged: "bg-highlight/15 text-highlight",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", map[status] ?? map["draft"])}>{status}</span>;
}
