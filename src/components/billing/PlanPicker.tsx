import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button } from '../ui';
import { billingApi, planLimitMessage } from '../../services/api';
import { clearPendingPlan } from '../../utils/pendingPlan';

function formatLimit(value: number | null) {
  return value == null ? 'Unlimited' : String(value);
}

export function PlanPicker({
  plans,
  configured,
  configurationMessage,
  defaultInterval = 'MONTHLY',
  highlightedPlan,
  ctaLabel = 'Start 7-Day Free Trial',
}: {
  plans: any[];
  configured: boolean;
  configurationMessage?: string;
  defaultInterval?: 'MONTHLY' | 'ANNUAL';
  highlightedPlan?: string | null;
  ctaLabel?: string;
}) {
  const [interval, setInterval] = useState<'MONTHLY' | 'ANNUAL'>(defaultInterval);
  const [busy, setBusy] = useState<string | null>(null);
  const paid = (plans || []).filter((plan) => plan.key !== 'FREE');

  const startTrial = async (planKey: string) => {
    setBusy(planKey);
    try {
      const response = await billingApi.checkout(planKey, interval);
      clearPendingPlan();
      const url = response.data.data.url;
      if (url) {
        clearPendingPlan();
        window.location.href = url;
      }
      else toast.error('Checkout is not available');
    } catch (error: any) {
      toast.error(planLimitMessage(error) || 'Checkout is not available');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" className={`px-3 py-1.5 rounded-lg ${interval === 'MONTHLY' ? 'bg-primary-500/20 text-primary-300' : 'text-zinc-400'}`} onClick={() => setInterval('MONTHLY')}>Monthly</button>
        <button type="button" className={`px-3 py-1.5 rounded-lg ${interval === 'ANNUAL' ? 'bg-primary-500/20 text-primary-300' : 'text-zinc-400'}`} onClick={() => setInterval('ANNUAL')}>Annual</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {paid.map((plan) => {
          const available = interval === 'MONTHLY' ? plan.hasMonthly : plan.hasAnnual;
          return (
            <Card key={plan.key} className={`p-5 space-y-3 ${highlightedPlan === plan.key ? 'ring-1 ring-primary-500/60' : ''}`} data-testid={`plan-card-${plan.key}`}>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-zinc-400">{plan.description}</p>
              <ul className="text-sm text-zinc-300 space-y-1">
                <li>{formatLimit(plan.entitlements?.maxCampaigns)} campaigns</li>
                <li>{formatLimit(plan.entitlements?.maxTeamMembers)} seats</li>
                <li>{plan.entitlements?.customDomainEnabled ? 'Custom domains' : 'No custom domains'}</li>
              </ul>
              <Button
                className="w-full"
                loading={busy === plan.key}
                disabled={!configured || !available}
                onClick={() => startTrial(plan.key)}
                data-testid={`start-trial-${plan.key}`}
              >
                {ctaLabel}
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="text-sm text-zinc-400">No charge today. Your selected plan will renew automatically after the 7-day trial unless you cancel.</p>
      {!configured && configurationMessage && (
        <p className="text-sm text-amber-300" data-testid="billing-unconfigured">{configurationMessage}</p>
      )}
    </div>
  );
}
