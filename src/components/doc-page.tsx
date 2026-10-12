import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";

export function DocPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Brand />
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/guide" className="hover:text-foreground">User guide</Link>
          <Link to="/self-host" className="hover:text-foreground">Self-hosting</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl text-primary">{title}</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
        <div className="mt-8 space-y-10">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function Step({ n, title, children }: { n: number | string; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</div>
      <div className="min-w-0 flex-1 space-y-3 text-muted-foreground [&_strong]:text-foreground">
        <h2 className="text-xl text-foreground">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs text-foreground"><code>{children}</code></pre>;
}
