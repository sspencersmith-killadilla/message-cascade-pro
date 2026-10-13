import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Cadence" },
      { name: "description", content: "Sign in or create a free Cadence account for your organization." },
      { property: "og:title", content: "Sign in — Cadence" },
      { property: "og:description", content: "Sign in or create a free Cadence account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/app" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("If that email has an account, a reset link is on its way.");
        setMode("signin");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-soft">
        <Brand className="mb-6 justify-center" />
        <h1 className="text-center text-2xl text-primary">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
        {mode === "forgot" ? (
          <p className="mt-3 mb-4 text-center text-sm text-muted-foreground">Enter your email and we'll send you a link to choose a new password.</p>
        ) : (<>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        </>)}
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          )}
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pw">Password</Label>
                {mode === "signin" && <button type="button" className="text-xs font-medium text-highlight hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>}
              </div>
              <Input id="pw" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>{mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : mode === "forgot" ? "Remembered it?" : "New to Cadence?"}{" "}
          <button className="font-medium text-highlight hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">Invited by your organization? Sign up with the email they used.</p>
      </div>
    </div>
  );
}
