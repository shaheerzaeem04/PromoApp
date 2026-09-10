import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlanPicker } from '../../components/billing/PlanPicker';
import { billingApi } from '../../services/api';
import { clearPendingPlan, normalizeInterval, normalizePlanKey, readPendingPlan, storePendingPlan } from '../../utils/pendingPlan';
import { Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export function ChoosePlanPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const pending = readPendingPlan();
  const planFromUrl = normalizePlanKey(params.get('plan')) || pending.planKey;
  const interval = normalizeInterval(params.get('interval') || pending.interval);
  const [autoStarted, setAutoStarted] = useState(false);

  const plans = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.plans().then((r) => r.data.data),
    retry: 1,
  });
  const billing = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingApi.summary().then((r) => r.data.data),
    retry: 1,
  });

  useEffect(() => {
    if (params.get('plan')) storePendingPlan(params.get('plan'), params.get('interval'));
  }, [params]);

  useEffect(() => {
    if (autoStarted || !planFromUrl || !billing.data?.stripeConfigured || user?.emailVerified === false) return;
    if (params.get('autocheckout') !== '1' && !pending.planKey) return;
    setAutoStarted(true);
    billingApi.checkout(planFromUrl, interval).then((response) => {
      const url = response.data.data.url;
      if (url) {
        clearPendingPlan();
        window.location.href = url;
      }
    }).catch(() => setAutoStarted(false));
  }, [autoStarted, billing.data, interval, params, pending.planKey, planFromUrl, user?.emailVerified]);

  useEffect(() => {
    if (!billing.data) return;
    if (!billing.data.needsPlan && (billing.data.lifecycle === 'TRIALING' || billing.data.lifecycle === 'ACTIVE')) {
      navigate('/dashboard', { replace: true });
    }
  }, [billing.data, navigate]);

  if (user && user.emailVerified === false) {
    return (
      <Card className="p-8 max-w-xl mx-auto space-y-3">
        <h1 className="text-2xl font-display font-bold">Verify your email</h1>
        <p className="text-zinc-400">Verify your email before starting a trial. We do not create a Stripe customer until your address is confirmed.</p>
        <Link to="/check-email" className="btn-primary inline-flex">Check email</Link>
      </Card>
    );
  }

  if (plans.isError || billing.isError) {
    return (
      <Card className="p-8 max-w-xl mx-auto space-y-3" data-testid="choose-plan-error">
        <h1 className="text-2xl font-display font-bold">Choose a plan</h1>
        <p className="text-red-400">Unable to load billing information.</p>
        <button type="button" className="btn-primary" onClick={() => { plans.refetch(); billing.refetch(); }}>Retry</button>
      </Card>
    );
  }

  if (!plans.data || !billing.data) {
    return <p className="text-zinc-400" data-testid="choose-plan-loading">Loading plans…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="choose-plan">
      <div>
      <h1 className="page-title">Choose your plan</h1>
        <p className="text-zinc-400 mt-2">Start a 7-day free trial. A card is required. You will not be charged today.</p>
      </div>
      <PlanPicker
        plans={plans.data}
        configured={Boolean(billing.data.stripeConfigured)}
        configurationMessage={billing.data.environmentUnconfiguredMessage}
        defaultInterval={interval}
        highlightedPlan={planFromUrl}
      />
    </div>
  );
}
