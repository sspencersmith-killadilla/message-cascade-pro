import { createFileRoute } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use — Cadence" },
      { name: "description", content: "The plain-language terms for using Cadence, the open-source cascade communications tool." },
      { property: "og:title", content: "Terms of use — Cadence" },
      { property: "og:description", content: "Plain-language terms for using Cadence." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-3xl px-6 py-6"><Brand /></header>
      <main className="mx-auto max-w-3xl space-y-4 px-6 pb-16 text-muted-foreground">
        <h1 className="text-3xl text-primary">Terms of use</h1>
        <p>Cadence is free, open-source software under the MIT license. Organizations that run their own copy set their own terms.</p>
        <p>You're responsible for what you send through Cadence and for having permission to add the people you invite.</p>
        <p>Don't use Cadence to harass anyone, break the law, or try to access data that isn't yours.</p>
        <p>The service is provided as-is, without warranties. We may change these terms; we'll post updates here.</p>
      </main>
      <PublicFooter />
    </div>
  ),
});
