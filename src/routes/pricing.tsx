import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { useI18n } from "@/lib/i18n";
import { PLANS, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AI Visibility Local" },
      { name: "description", content: "Free, Starter ($19) and Agency ($49) plans for monitoring AI mentions of local businesses." },
      { property: "og:title", content: "Pricing — AI Visibility Local" },
      { property: "og:description", content: "Free, Starter $19 and Agency $49 plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

export function PlanCards({ current }: { current?: PlanId }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(Object.keys(PLANS) as PlanId[]).map((id) => {
        const p = PLANS[id];
        const featured = id === "starter";
        return (
          <div key={id} className={`flex flex-col rounded-2xl border bg-card p-7 shadow-soft ${featured ? "border-primary ring-2 ring-primary/20" : ""}`}>
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-4 font-display text-4xl font-semibold">${p.priceUsd}<span className="text-base font-normal text-muted-foreground">{t("per_month")}</span></p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {[`${p.projects} ${t("projects")}`, `${p.monthlyQueries} ${t("queries")}`, t("p_common"), t("p_reports")].map((f) => (
                <li key={f} className="flex gap-2"><Check className="size-4 text-primary" />{f}</li>
              ))}
            </ul>
            {current === id ? (
              <Button variant="secondary" className="mt-7" disabled>Current plan</Button>
            ) : id === "free" ? (
              <Button variant={featured ? "hero" : "outline"} className="mt-7" asChild><Link to="/auth" search={{ mode: "signup" }}>{t("choose_free")}</Link></Button>
            ) : (
              <Button variant="outline" className="mt-7" disabled>{t("coming_soon")}</Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pricing() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-hero">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold">{t("pricing_title")}</h1>
          <p className="mt-4 text-muted-foreground">{t("pricing_sub")}</p>
        </div>
        <div className="mt-12"><PlanCards /></div>
      </main>
      <MarketingFooter />
    </div>
  );
}
