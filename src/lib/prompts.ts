/** Standardized prompts. The client brand name is never injected, to avoid biasing the answer. */
export const SYSTEM_PROMPT =
  "You are a helpful assistant answering a question from a person looking for local businesses or services. " +
  "Answer naturally and concisely. When appropriate, name specific businesses you know of. " +
  "If you are not confident a business exists, do not invent it.";

export function buildUserPrompt(question: string, ctx: { city: string; country: string; sector: string }) {
  return `${question.trim()}\n\nContext: the person is located in ${ctx.city}, ${ctx.country}. Topic: ${ctx.sector}.`;
}

export const METHODOLOGY_POINTS = [
  "Each question is sent once, unchanged, to the configured AI model API (provider and model are recorded per run).",
  "The standardized system prompt and user prompt are stored with every response for audit.",
  "The client's brand name is never included in the prompt.",
  "A mention is counted only when the exact name (whole word, case-insensitive) or the website domain appears in the raw response.",
  "Failed API calls are recorded as errors and excluded from mention rates — they are never estimated or filled in.",
  "Results reflect model API responses at a point in time. They do not replicate consumer apps such as ChatGPT, which use different settings, memory, browsing and personalization.",
];
