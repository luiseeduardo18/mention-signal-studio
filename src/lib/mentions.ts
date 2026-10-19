/**
 * Conservative, auditable mention detection.
 * A brand counts as mentioned only when its exact name (case-insensitive, whole-word)
 * or its website domain appears in the raw response. No fuzzy matching, no inference.
 */
export type Entity = { name: string; website?: string | null; type: "brand" | "competitor" };

export type MentionResult = {
  mentioned: boolean;
  method: "exact_name" | "domain" | null;
  snippet: string | null;
  index: number | null;
};

const MIN_NAME_LENGTH = 3;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function domainOf(website?: string | null): string | null {
  if (!website) return null;
  try {
    const url = new URL(website.includes("://") ? website : `https://${website}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

function snippetAt(text: string, index: number, length: number) {
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + length + 80);
  return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
}

export function detectMention(text: string, entity: Entity): MentionResult {
  const none: MentionResult = { mentioned: false, method: null, snippet: null, index: null };
  if (!text) return none;
  const name = entity.name.trim();
  if (name.length >= MIN_NAME_LENGTH) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(name)}(?![\\p{L}\\p{N}])`, "iu");
    const m = re.exec(text);
    if (m) return { mentioned: true, method: "exact_name", snippet: snippetAt(text, m.index, m[0].length), index: m.index };
  }
  const domain = domainOf(entity.website);
  if (domain) {
    const i = text.toLowerCase().indexOf(domain);
    if (i >= 0) return { mentioned: true, method: "domain", snippet: snippetAt(text, i, domain.length), index: i };
  }
  return none;
}
