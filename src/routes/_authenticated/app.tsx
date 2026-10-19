import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — AI Visibility Local" }] }),
  component: App,
});

function App() {
  const navigate = useNavigate();
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await supabase.from("projects").select("id, name, city, country")).data ?? [],
  });
  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Logo />
        <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}>Sign out</Button>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {projects && projects.length === 0 && (
          <p className="mt-6 rounded-2xl border bg-card p-8 text-muted-foreground">No projects yet. No analysis has been run, so there is no data to show.</p>
        )}
        <ul className="mt-6 space-y-2">
          {projects?.map((p) => <li key={p.id} className="rounded-xl border bg-card p-4">{p.name} — {p.city}, {p.country}</li>)}
        </ul>
      </main>
    </div>
  );
}
