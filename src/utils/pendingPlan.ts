const PLAN_KEY = 'promo.pendingPlan';
const INTERVAL_KEY = 'promo.pendingInterval';

const PLAN_ALIASES: Record<string, 'STARTER' | 'BUSINESS' | 'PREMIUM'> = {
  starter: 'STARTER',
  growth: 'STARTER',
  business: 'BUSINESS',
  premium: 'PREMIUM',
};

export function normalizePlanKey(raw: string | null | undefined): 'STARTER' | 'BUSINESS' | 'PREMIUM' | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return PLAN_ALIASES[key] || null;
}

export function normalizeInterval(raw: string | null | undefined): 'MONTHLY' | 'ANNUAL' {
  return raw?.trim().toLowerCase() === 'annual' || raw?.trim().toLowerCase() === 'yearly' ? 'ANNUAL' : 'MONTHLY';
}

export function storePendingPlan(plan: string | null, interval: string | null) {
  const planKey = normalizePlanKey(plan);
  if (planKey) sessionStorage.setItem(PLAN_KEY, planKey);
  if (interval) sessionStorage.setItem(INTERVAL_KEY, normalizeInterval(interval));
}

export function readPendingPlan(): { planKey: 'STARTER' | 'BUSINESS' | 'PREMIUM' | null; interval: 'MONTHLY' | 'ANNUAL' } {
  return {
    planKey: normalizePlanKey(sessionStorage.getItem(PLAN_KEY)),
    interval: normalizeInterval(sessionStorage.getItem(INTERVAL_KEY)),
  };
}

export function clearPendingPlan() {
  sessionStorage.removeItem(PLAN_KEY);
  sessionStorage.removeItem(INTERVAL_KEY);
}
