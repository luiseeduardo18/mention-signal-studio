export type LlmProvider = "gemini" | "openai";
export type LlmConfig = { provider: LlmProvider; model: string; apiKey: string };

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
};

const MAX_OUTPUT_TOKENS = 800;
const TIMEOUT_MS = 30_000;

/** Reads provider configuration from server env. Returns null when no key is configured. */
export function getLlmConfig(): LlmConfig | null {
  const wanted = (process.env["LLM_PROVIDER"] || "").toLowerCase();
  const gemini = process.env["GEMINI_API_KEY"];
  const openai = process.env["OPENAI_API_KEY"];
  let provider: LlmProvider | null = null;
  if (wanted === "gemini" && gemini) provider = "gemini";
  else if (wanted === "openai" && openai) provider = "openai";
  else if (!wanted) provider = gemini ? "gemini" : openai ? "openai" : null;
  if (!provider) return null;
  return {
    provider,
    model: process.env["LLM_MODEL"] || DEFAULT_MODELS[provider],
    apiKey: provider === "gemini" ? gemini! : openai!,
  };
}

export function getGlobalMonthlyCap(): number | null {
  const v = Number(process.env["MONTHLY_QUERY_CAP"]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

export class LlmError extends Error {}

export async function callLlm(cfg: LlmConfig, system: string, user: string): Promise<string> {
  let res: Response;
  try {
    if (cfg.provider === "gemini") {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": cfg.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } else {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    }
  } catch (e) {
    throw new LlmError(`Network error or timeout calling ${cfg.provider}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[llm] ${cfg.provider} ${res.status}: ${body.slice(0, 500)}`);
    if (res.status === 401 || res.status === 403) throw new LlmError("API key rejected by provider");
    if (res.status === 429) throw new LlmError("Provider rate limit or quota exceeded");
    throw new LlmError(`Provider returned HTTP ${res.status}`);
  }
  const json: any = await res.json();
  const text =
    cfg.provider === "gemini"
      ? (json?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("")
      : json?.choices?.[0]?.message?.content ?? "";
  if (!text || typeof text !== "string" || !text.trim()) throw new LlmError("Provider returned an empty response");
  return text;
}
