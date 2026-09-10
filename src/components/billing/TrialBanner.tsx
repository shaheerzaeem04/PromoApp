import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../../services/api';

function formatRenewal(billing: any) {
  const date = billing.trialEndsAt || billing.currentPeriodEnd;
  const when = date ? new Date(date).toLocaleDateString() : null;
  const interval = billing.billingInterval === 'ANNUAL' ? 'year' : 'month';
  if (billing.renewalAmountCents != null && when) {
    const amount = (billing.renewalAmountCents / 100).toFixed(0);
    const currency = (billing.renewalCurrency || 'usd').toUpperCase();
    return `Renews for ${currency} ${amount}/${interval} on ${when}`;
  }
  if (when) return `Renews on ${when} unless you cancel`;
  return 'Renews automatically after the trial unless you cancel';
}

export function TrialBanner() {
  const billing = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingApi.summary().then((r) => r.data.data),
    retry: 1,
    staleTime: 15_000,
  });

  if (!billing.data || billing.data.lifecycle !== 'TRIALING') return null;
  const days = billing.data.daysRemaining;
  const plan = billing.data.planName || billing.data.selectedPlanKey || 'Paid';

  return (
    <div className="bg-primary-500/10 border-b border-primary-500/20 px-4 md:px-8 py-3 text-sm text-primary-100 flex flex-wrap gap-3 items-center justify-between" data-testid="trial-banner">
      <span>
        {plan} Trial{typeof days === 'number' ? ` · ${days} day${days === 1 ? '' : 's'} remaining` : ''}
        <span className="text-primary-200/80"> · {formatRenewal(billing.data)}</span>
      </span>
      <Link to="/workspace?tab=billing" className="underline" data-testid="trial-banner-manage">Manage Billing</Link>
    </div>
  );
}
