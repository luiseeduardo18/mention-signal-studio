import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/marketing";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: s.mode === "signup" ? ("signup" as const) : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — AI Visibility Local" },
      { name: "description", content: "Sign in or create your AI Visibility Local agency account." },
      { property: "og:title", content: "Sign in — AI Visibility Local" },
      { property: "og:description", content: "Access your agency workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(72) });

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const em = z.string().trim().email().safeParse(email);
        if (!em.success) throw new Error("Enter a valid email");
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("Check your inbox for a password reset link.");
        return;
      }
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) throw new Error("Enter a valid email and a password of at least 8 characters.");
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/app", data: { org_name: org.trim().slice(0, 120) } },
        });
        if (error) throw error;
        setSent("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error("Google sign-in failed");
    if (r.redirected) return;
    navigate({ to: "/app" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-glow">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">
          {mode === "signup" ? "Create your agency account" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        {sent ? (
          <p className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">{sent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5"><Label>Agency name</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} maxLength={120} placeholder="Acme Local SEO" /></div>
            )}
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} /></div>
            {mode !== "forgot" && (
              <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} /></div>
            )}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
            {mode !== "forgot" && (
              <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
            )}
          </form>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
          <button className="text-primary" onClick={() => { setSent(null); setMode(mode === "signup" ? "signin" : "signup"); }}>
            {mode === "signup" ? "Already have an account? Sign in" : "No account? Sign up"}
          </button>
          {mode === "signin" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}
