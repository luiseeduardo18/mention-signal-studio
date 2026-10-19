import { describe, expect, it } from "vitest";
import { detectMention, domainOf } from "@/lib/mentions";
import { checkRunAllowed, PLANS } from "@/lib/plans";

describe("pricing", () => {
  it("Starter costs $19 and Agency $49", () => {
    expect(PLANS.starter.priceUsd).toBe(19);
    expect(PLANS.agency.priceUsd).toBe(49);
    expect(PLANS.free.priceUsd).toBe(0);
  });
});

describe("mention detection", () => {
  it("matches the exact name as a whole word, case-insensitive", () => {
    const r = detectMention("I recommend padaria sol nascente downtown.", { name: "Padaria Sol Nascente", type: "brand" });
    expect(r.mentioned).toBe(true);
    expect(r.method).toBe("exact_name");
  });
  it("does not match a name embedded inside another word", () => {
    expect(detectMention("Try Solaris Dental.", { name: "Sol", type: "brand" }).mentioned).toBe(false);
    expect(detectMention("Visit ACMEX today", { name: "Acme", type: "brand" }).mentioned).toBe(false);
  });
  it("matches the website domain", () => {
    const r = detectMention("See acme.com.br for details", { name: "Zzz Co", website: "https://www.acme.com.br", type: "competitor" });
    expect(r.method).toBe("domain");
  });
  it("returns not mentioned for empty text", () => {
    expect(detectMention("", { name: "Acme", type: "brand" }).mentioned).toBe(false);
  });
  it("normalizes domains", () => {
    expect(domainOf("www.Example.com/path")).toBe("example.com");
  });
});

describe("run limits", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  it("blocks runs within the 60s cooldown", () => {
    const r = checkRunAllowed({ plan: "free", usedThisMonth: 0, questionCount: 3, lastRunAt: new Date(now.getTime() - 30_000), now });
    expect(r.ok).toBe(false);
  });
  it("blocks runs that exceed the monthly plan quota", () => {
    const r = checkRunAllowed({ plan: "free", usedThisMonth: 28, questionCount: 3, lastRunAt: null, now });
    expect(r.ok).toBe(false);
  });
  it("allows a run within quota", () => {
    expect(checkRunAllowed({ plan: "free", usedThisMonth: 27, questionCount: 3, lastRunAt: null, now }).ok).toBe(true);
  });
  it("respects the global spending cap", () => {
    const r = checkRunAllowed({ plan: "agency", usedThisMonth: 100, questionCount: 5, lastRunAt: null, now, globalMonthlyCap: 102 });
    expect(r.ok).toBe(false);
  });
  it("requires at least one question", () => {
    expect(checkRunAllowed({ plan: "free", usedThisMonth: 0, questionCount: 0, lastRunAt: null, now }).ok).toBe(false);
  });
});
