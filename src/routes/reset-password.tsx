import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Cadence" },
      { name: "description", content: "Choose a new password for your Cadence account." },
      { property: "og:title", content: "Reset your password — Cadence" },
      { property: "og:description", content: "Choose a new password for your Cadence account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setReady(true); setChecked(true); }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && (isRecovery || data.session)) setReady(true);
      setTimeout(() => setChecked(true), 1200);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/app" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-soft">
        <Brand className="mb-6 justify-center" />
        <h1 className="text-center text-2xl text-primary">Choose a new password</h1>
        {ready ? (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="new-password" /></div>
            <div><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" minLength={8} value={pw2} onChange={(e) => setPw2(e.target.value)} required autoComplete="new-password" /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
          </form>
        ) : checked ? (
          <div className="mt-6 space-y-4 text-center text-sm text-muted-foreground">
            <p>This reset link is invalid or has expired.</p>
            <Button asChild className="w-full"><Link to="/login" search={{ mode: "forgot" }}>Send a new link</Link></Button>
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">Checking your link…</p>
        )}
      </div>
    </div>
  );
}
