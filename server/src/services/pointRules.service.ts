import { PointRule } from '../models/PointRule.js';
import { POINT_RULES, POINT_RULE_KEYS, PointRuleKey } from '../constants/points.js';

export const POINT_RULES_CACHE_TTL_MS = 60_000;

export interface EffectivePointRule {
  key: PointRuleKey;
  amount: number;
  active: boolean;
  defaultAmount: number;
  /** false when no admin override is stored and the code default applies */
  customized: boolean;
  updatedAt: Date | null;
}

let cache: { rules: Map<PointRuleKey, EffectivePointRule>; expiresAt: number } | null = null;

/** Merges stored overrides with code defaults so every built-in key is always present. */
export async function listPointRules(): Promise<EffectivePointRule[]> {
  const stored = await PointRule.find({ key: { $in: POINT_RULE_KEYS } }).lean();
  const byKey = new Map(stored.map((rule) => [rule.key, rule]));
  return POINT_RULE_KEYS.map((key) => {
    const rule = byKey.get(key);
    return {
      key,
      amount: rule ? rule.amount : POINT_RULES[key],
      active: rule ? rule.active : true,
      defaultAmount: POINT_RULES[key],
      customized: Boolean(rule),
      updatedAt: rule?.updatedAt ?? null,
    };
  });
}

/**
 * Points to award for a rule. Inactive rules award 0; callers must skip writing a
 * transaction when the result is 0. Cached in memory for 60 seconds per process.
 */
export async function getPointRuleAmount(key: PointRuleKey): Promise<number> {
  if (!cache || cache.expiresAt <= Date.now()) {
    const rules = await listPointRules();
    cache = { rules: new Map(rules.map((rule) => [rule.key, rule])), expiresAt: Date.now() + POINT_RULES_CACHE_TTL_MS };
  }
  const rule = cache.rules.get(key);
  if (!rule) return POINT_RULES[key];
  return rule.active ? rule.amount : 0;
}

/** Call after an admin change so this process applies the new values immediately. */
export function clearPointRulesCache(): void {
  cache = null;
}
