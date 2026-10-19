import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display font-semibold">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground"><Radar className="size-4" /></span>
      AI Visibility Local
    </Link>
  );
}

export function MarketingHeader() {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <div className="flex rounded-full border p-0.5 text-xs">
            {(["en", "pt"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 font-medium ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {l === "en" ? "EN" : "PT-BR"}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/pricing">{t("nav_pricing")}</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/auth">{t("nav_login")}</Link></Button>
          <Button variant="hero" size="sm" asChild className="hidden sm:inline-flex"><Link to="/auth" search={{ mode: "signup" }}>{t("nav_start")}</Link></Button>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t py-10 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} {t("footer")}
    </footer>
  );
}
