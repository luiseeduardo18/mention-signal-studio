import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callLlm, getGlobalMonthlyCap, getLlmConfig, LlmError } from "./llm.server";
import { detectMention, type Entity } from "./mentions";
import { checkRunAllowed, planOf } from "./plans";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

export const getLlmStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const cfg = getLlmConfig();
    return cfg
      ? { configured: true as const, provider: cfg.provider, model: cfg.model, cap: getGlobalMonthlyCap() }
      : { configured: false as const, provider: null, model: null, cap: getGlobalMonthlyCap() };
  });

function monthStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS: only returns the project if the caller belongs to its organization.
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("id, org_id, name, website, sector, city, country, organizations(plan)")
      .eq("id", data.projectId)
      .maybeSingle();
    if (pErr || !project) return { ok: false as const, error: "Project not found." };

    const cfg = getLlmConfig();
    if (!cfg) return { ok: false as const, error: "No AI provider API key is configured on the server. No analysis was run." };

    const [{ data: questions }, { data: competitors }, { count: used }, { data: lastRun }] = await Promise.all([
      supabase.from("questions").select("id, text").eq("project_id", project.id).order("position"),
      supabase.from("competitors").select("name, website").eq("project_id", project.id),
      supabase
        .from("analysis_results")
        .select("id", { count: "exact", head: true })
        .eq("org_id", project.org_id)
        .gte("created_at", monthStart(new Date())),
      supabase.from("analysis_runs").select("started_at").eq("org_id", project.org_id).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const qs = questions ?? [];
    const plan = planOf((project as any).organizations?.plan);
    const check = checkRunAllowed({
      plan,
      usedThisMonth: used ?? 0,
      questionCount: qs.length,
      lastRunAt: lastRun ? new Date(lastRun.started_at) : null,
      now: new Date(),
      globalMonthlyCap: getGlobalMonthlyCap(),
    });
    if (!check.ok) return { ok: false as const, error: check.reason };

    const entities: Entity[] = [
      { name: project.name, website: project.website, type: "brand" },
      ...(competitors ?? []).map((c) => ({ name: c.name, website: c.website, type: "competitor" as const })),
    ];

    // Writes to results tables are server-only (no client INSERT policy), so results cannot be fabricated.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: run, error: rErr } = await supabaseAdmin
      .from("analysis_runs")
      .insert({ org_id: project.org_id, project_id: project.id, created_by: userId, provider: cfg.provider, model: cfg.model, questions_total: qs.length })
      .select("id")
      .single();
    if (rErr || !run) return { ok: false as const, error: "Could not start the run." };

    let okCount = 0;
    let lastError: string | null = null;
    for (const q of qs) {
      const userPrompt = buildUserPrompt(q.text, project);
      let raw: string | null = null;
      let err: string | null = null;
      try {
        raw = await callLlm(cfg, SYSTEM_PROMPT, userPrompt);
      } catch (e) {
        err = e instanceof LlmError ? e.message : "Unexpected error calling provider";
        lastError = err;
      }
      const { data: result } = await supabaseAdmin
        .from("analysis_results")
        .insert({
          run_id: run.id, org_id: project.org_id, project_id: project.id, question_id: q.id, question_text: q.text,
          system_prompt: SYSTEM_PROMPT, user_prompt: userPrompt, raw_response: raw,
          provider: cfg.provider, model: cfg.model, status: raw ? "ok" : "error", error: err,
        })
        .select("id")
        .single();
      if (raw && result) {
        okCount++;
        await supabaseAdmin.from("mentions").insert(
          entities.map((ent) => {
            const m = detectMention(raw!, ent);
            return {
              result_id: result.id, run_id: run.id, org_id: project.org_id, project_id: project.id,
              entity_name: ent.name, entity_type: ent.type, mentioned: m.mentioned,
              match_method: m.method, matched_snippet: m.snippet, first_index: m.index,
            };
          }),
        );
      }
    }

    const status = okCount === qs.length ? "completed" : okCount === 0 ? "failed" : "partial";
    await supabaseAdmin
      .from("analysis_runs")
      .update({ status, questions_ok: okCount, finished_at: new Date().toISOString(), error: lastError })
      .eq("id", run.id);

    return { ok: true as const, runId: run.id, status, okCount, total: qs.length };
  });
