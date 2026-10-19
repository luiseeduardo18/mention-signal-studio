import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "pt";

const dict = {
  en: {
    nav_pricing: "Pricing", nav_login: "Sign in", nav_start: "Start free",
    hero_badge: "For local SEO agencies",
    hero_title: "Know when AI assistants mention your local clients.",
    hero_sub: "Run standardized questions against AI model APIs, see which businesses are named, and compare your clients with up to three competitors — with every raw answer kept for audit.",
    hero_cta: "Create free account", hero_cta2: "See pricing",
    honesty: "We query model APIs (Gemini or OpenAI) with fixed prompts. Results are a point-in-time sample and do not replicate consumer apps like ChatGPT.",
    example: "Illustrative example — not real data",
    f_title: "Built for evidence, not guesses",
    f1_t: "Projects per client", f1_d: "Website, sector, city and country, plus up to 3 competitors and 10 editable questions.",
    f2_t: "Auditable mentions", f2_d: "Exact name or domain matches only. Every match links to the raw response, prompt, model and timestamp.",
    f3_t: "Client-ready reports", f3_d: "Printable reports with the methodology spelled out, ready to export as PDF.",
    how_title: "How it works",
    s1: "Add the client business and competitors", s2: "Pick or edit the local questions", s3: "Run the analysis and share the report",
    method_title: "Transparent methodology",
    method_d: "No invented numbers. If the API key is missing or a call fails, we show the error — never an estimate.",
    cta_title: "Start monitoring AI visibility today", cta_d: "Free plan includes 1 project and 30 questions per month.",
    footer: "AI Visibility Local. Not affiliated with OpenAI or Google.",
    pricing_title: "Simple pricing for agencies", pricing_sub: "Paid plans will be available once billing is enabled. No card required today.",
    per_month: "/month", projects: "projects", queries: "AI questions / month",
    choose_free: "Start free", coming_soon: "Billing coming soon",
    p_common: "Up to 3 competitors and 10 questions per project", p_reports: "Printable reports & history",
  },
  pt: {
    nav_pricing: "Preços", nav_login: "Entrar", nav_start: "Começar grátis",
    hero_badge: "Para agências de SEO local",
    hero_title: "Saiba quando assistentes de IA citam seus clientes locais.",
    hero_sub: "Execute perguntas padronizadas em APIs de modelos de IA, veja quais empresas são citadas e compare seus clientes com até três concorrentes — com cada resposta bruta guardada para auditoria.",
    hero_cta: "Criar conta grátis", hero_cta2: "Ver preços",
    honesty: "Consultamos APIs de modelos (Gemini ou OpenAI) com prompts fixos. Os resultados são uma amostra pontual e não replicam apps de consumidor como o ChatGPT.",
    example: "Exemplo ilustrativo — não são dados reais",
    f_title: "Feito para evidências, não palpites",
    f1_t: "Projetos por cliente", f1_d: "Site, setor, cidade e país, mais até 3 concorrentes e 10 perguntas editáveis.",
    f2_t: "Menções auditáveis", f2_d: "Somente correspondência exata de nome ou domínio. Cada menção liga à resposta bruta, prompt, modelo e horário.",
    f3_t: "Relatórios para clientes", f3_d: "Relatórios para impressão com a metodologia explícita, prontos para exportar em PDF.",
    how_title: "Como funciona",
    s1: "Cadastre a empresa do cliente e os concorrentes", s2: "Escolha ou edite as perguntas locais", s3: "Execute a análise e compartilhe o relatório",
    method_title: "Metodologia transparente",
    method_d: "Nada de números inventados. Se a chave da API faltar ou uma chamada falhar, mostramos o erro — nunca uma estimativa.",
    cta_title: "Comece a monitorar a visibilidade em IA hoje", cta_d: "O plano grátis inclui 1 projeto e 30 perguntas por mês.",
    footer: "AI Visibility Local. Sem afiliação com OpenAI ou Google.",
    pricing_title: "Preços simples para agências", pricing_sub: "Planos pagos ficarão disponíveis quando a cobrança for ativada. Nenhum cartão é necessário hoje.",
    per_month: "/mês", projects: "projetos", queries: "perguntas de IA / mês",
    choose_free: "Começar grátis", coming_soon: "Cobrança em breve",
    p_common: "Até 3 concorrentes e 10 perguntas por projeto", p_reports: "Relatórios para impressão e histórico",
  },
} as const;

export type DictKey = keyof (typeof dict)["en"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "en", setLang: () => {}, t: (k) => dict.en[k],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "pt" || saved === "en") setLangState(saved);
    else if (navigator.language?.toLowerCase().startsWith("pt")) setLangState("pt");
  }, []);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
