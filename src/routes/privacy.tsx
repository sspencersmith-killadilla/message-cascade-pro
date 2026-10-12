import { createFileRoute } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Cadence" },
      { name: "description", content: "What Cadence stores, who can see it, and how AI is used on team feedback." },
      { property: "og:title", content: "Privacy — Cadence" },
      { property: "og:description", content: "What Cadence stores and who can see it." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-3xl px-6 py-6"><Brand /></header>
      <main className="mx-auto max-w-3xl space-y-4 px-6 pb-16 text-muted-foreground">
        <h1 className="text-3xl text-primary">Privacy</h1>
        <p>Cadence stores your name, email, organization details, the messages your organization sends, and team feedback.</p>
        <p>Each organization is private. Managers see only the cascades sent to them and their own replies. Admins see all progress and feedback for their organization.</p>
        <p>When an admin asks for an AI summary, feedback text is processed by Lovable AI to produce themes. Names are not included.</p>
        <p>We don't sell your data. Admins can remove people and delete cascades at any time.</p>
      </main>
      <PublicFooter />
    </div>
  ),
});
