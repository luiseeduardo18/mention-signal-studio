import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, FolderKanban, ShieldCheck, ScanSearch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Visibility Local — Track AI mentions for local businesses" },
      { name: "description", content: "Monitor whether AI model answers mention your local clients and their competitors. Auditable, transparent, built for local SEO agencies." },
      { property: "og:title", content: "AI Visibility Local" },
      { property: "og:description", content: "Auditable AI mention tracking for local SEO agencies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{t("hero_badge")}</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{t("hero_title")}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>{t("hero_cta")}</Link></Button>
              <Button variant="heroOutline" size="lg" asChild><Link to="/pricing">{t("hero_cta2")}</Link></Button>
            </div>
            <p className="mt-6 flex max-w-xl gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />{t("honesty")}</p>
          </div>
          <ExampleCard label={t("example")} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold">{t("f_title")}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { i: FolderKanban, a: t("f1_t"), b: t("f1_d") },
            { i: ScanSearch, a: t("f2_t"), b: t("f2_d") },
            { i: FileText, a: t("f3_t"), b: t("f3_d") },
          ].map(({ i: Icon, a, b }) => (
            <div key={a} className="rounded-2xl border bg-card p-6 shadow-soft">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" /></span>
              <h3 className="mt-4 text-lg font-semibold">{a}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">{t("how_title")}</h2>
            <ol className="mt-8 space-y-5">
              {[t("s1"), t("s2"), t("s3")].map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-display font-semibold">{i + 1}</span>
                  <span className="text-lg">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-8">
            <h3 className="text-xl font-semibold">{t("method_title")}</h3>
            <p className="mt-3 opacity-80">{t("method_d")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold">{t("cta_title")}</h2>
        <p className="mt-3 text-muted-foreground">{t("cta_d")}</p>
        <Button variant="hero" size="lg" className="mt-8" asChild><Link to="/auth" search={{ mode: "signup" }}>{t("hero_cta")}</Link></Button>
      </section>
      <MarketingFooter />
    </div>
  );
}

function ExampleCard({ label }: { label: string }) {
  const rows = [
    { n: "Your client", w: 70 },
    { n: "Competitor A", w: 45 },
    { n: "Competitor B", w: 20 },
  ];
  return (
    <div className="relative rounded-3xl border bg-card p-6 shadow-glow">
      <span className="absolute -top-3 right-6 rounded-full border bg-warning/20 px-3 py-1 text-xs font-semibold">{label}</span>
      <p className="text-sm font-semibold">"Best dentist in Curitiba?"</p>
      <p className="mt-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        …popular options include <mark className="rounded bg-accent px-1 text-accent-foreground">Your client</mark> and Competitor A…
      </p>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.n}>
            <div className="flex justify-between text-xs"><span>{r.n}</span><CheckCircle2 className="size-3.5 text-success" /></div>
            <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-brand" style={{ width: `${r.w}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
