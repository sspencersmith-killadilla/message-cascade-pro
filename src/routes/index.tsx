import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bell, MessageSquareText, Sparkles, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import logo from "@/assets/logo-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadence — Cascade communications that reach every team" },
      { name: "description", content: "Send one message to every manager, see who has shared it, and hear back from every team. Free and open source." },
      { property: "og:title", content: "Cadence — Cascade communications that reach every team" },
      { property: "og:description", content: "Send one message to every manager, track who shared it, and roll up team feedback with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: MessageSquareText, title: "One clear message", text: "Write it once, add talking points and files, set a deadline." },
  { icon: Users, title: "Straight to every manager", text: "Send to all managers or chosen departments in one click." },
  { icon: BarChart3, title: "See who shared it", text: "Live progress by department, with overdue teams called out." },
  { icon: Bell, title: "Gentle reminders", text: "Emails when it lands, before it's due, and when it's late." },
  { icon: Sparkles, title: "AI roll-ups", text: "Feedback grouped into themes, concerns, and open questions." },
  { icon: Upload, title: "Bring your org chart", text: "Upload a spreadsheet of people and who they report to." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/demo">Demo</Link></Button>
          <Button asChild><Link to="/login">Sign in</Link></Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-highlight">Free · open source · for any organization</p>
          <h1 className="text-4xl leading-tight text-primary md:text-6xl">
            Every team hears it. <span className="text-brand">Every voice comes back.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Cadence carries leadership messages to every manager, tracks who has shared them with their team, and rolls the feedback back up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/login" search={{ mode: "signup" }}>Start free <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/demo">Try the demo</Link></Button>
          </div>
        </div>
        <div className="relative mx-auto">
          <div className="absolute inset-0 -z-10 rounded-full bg-brand opacity-20 blur-3xl" />
          <img src={logo} alt="Cadence cascade mark" width={256} height={256} className="h-56 w-56 md:h-72 md:w-72" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-soft">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg text-primary">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
