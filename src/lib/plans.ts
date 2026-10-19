export type PlanId = "free" | "starter" | "agency";

export const PLANS: Record<PlanId, { name: string; priceUsd: number; projects: number; monthlyQueries: number }> = {
  free: { name: "Free", priceUsd: 0, projects: 1, monthlyQueries: 30 },
  starter: { name: "Starter", priceUsd: 19, projects: 5, monthlyQueries: 300 },
  agency: { name: "Agency", priceUsd: 49, projects: 25, monthlyQueries: 1500 },
};

export const MAX_COMPETITORS = 3;
export const MAX_QUESTIONS = 10;
export const RUN_COOLDOWN_SECONDS = 60;

export function planOf(p: string | null | undefined): PlanId {
  return p === "starter" || p === "agency" ? p : "free";
}

export type RunCheck = { ok: true } | { ok: false; reason: string };

/** Decide whether a new analysis run may start. Pure: used by the server and tests. */
export function checkRunAllowed(args: {
  plan: PlanId;
  usedThisMonth: number;
  questionCount: number;
  lastRunAt: Date | null;
  now: Date;
  globalMonthlyCap?: number | null;
}): RunCheck {
  const { plan, usedThisMonth, questionCount, lastRunAt, now, globalMonthlyCap } = args;
  if (questionCount < 1) return { ok: false, reason: "Add at least one question before running an analysis." };
  if (questionCount > MAX_QUESTIONS) return { ok: false, reason: `Maximum of ${MAX_QUESTIONS} questions per project.` };
  if (lastRunAt && (now.getTime() - lastRunAt.getTime()) / 1000 < RUN_COOLDOWN_SECONDS) {
    return { ok: false, reason: `Please wait ${RUN_COOLDOWN_SECONDS} seconds between analyses.` };
  }
  const limit = PLANS[plan].monthlyQueries;
  if (usedThisMonth + questionCount > limit) {
    return { ok: false, reason: `Monthly query limit reached for the ${PLANS[plan].name} plan (${limit}).` };
  }
  if (globalMonthlyCap != null && usedThisMonth + questionCount > globalMonthlyCap) {
    return { ok: false, reason: "The workspace spending cap for this month has been reached." };
  }
  return { ok: true };
}
