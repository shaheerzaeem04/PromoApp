import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button, Input } from '../../components/ui';
import { billingApi, planLimitMessage, workspaceApi } from '../../services/api';
import { PlanPicker } from '../../components/billing/PlanPicker';

type BillingView =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'permission' }
  | { type: 'verify' }
  | { type: 'unconfigured'; message?: string }
  | { type: 'no_plan'; data: any; plans: any }
  | { type: 'active'; data: any; lifecycle: string };

function resolveBillingView(current: any, billing: any, plans: any): BillingView {
  if (current.isPending || !current.data) {
    if (current.isError) return { type: 'error' };
    return { type: 'loading' };
  }
  if (current.isError) return { type: 'error' };
  if (!current.data.permissions?.billing) return { type: 'permission' };

  const billingSettled = billing.isSuccess || billing.isError;
  const plansSettled = plans.isSuccess || plans.isError;
  if (!billingSettled || !plansSettled || billing.isPending || plans.isPending) {
    return { type: 'loading' };
  }

  if (billing.isError || plans.isError || !billing.data || !plans.data) {
    return { type: 'error' };
  }

  const data = billing.data;
  if (data.needsEmailVerification) return { type: 'verify' };
  if (!data.stripeConfigured) {
    return { type: 'unconfigured', message: data.environmentUnconfiguredMessage };
  }

  const lifecycle = data.lifecycle || 'NO_PLAN';
  if (lifecycle === 'NO_PLAN' || lifecycle === 'INCOMPLETE' || lifecycle === 'CANCELED' || data.needsPlan) {
    return { type: 'no_plan', data, plans: plans.data };
  }

  return { type: 'active', data, lifecycle };
}

export function BillingPane() {
  const current = useQuery({
    queryKey: ['workspace-current'],
    queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data),
  });
  const billing = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingApi.summary().then((r) => r.data.data),
    staleTime: 15_000,
    retry: 1,
  });
  const plans = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.plans().then((r) => r.data.data),
    staleTime: 15_000,
    retry: 1,
  });

  const retry = () => {
    void current.refetch();
    void billing.refetch();
    void plans.refetch();
  };

  const portal = async () => {
    try {
      const response = await billingApi.portal();
      const url = response.data.data.url;
      if (url) window.location.href = url;
    } catch (error: any) {
      toast.error(planLimitMessage(error) || 'Billing portal is not available');
    }
  };

  const view = resolveBillingView(current, billing, plans);

  if (view.type === 'loading') {
    return <Card className="p-6 text-zinc-400" data-testid="billing-loading">Loading billing…</Card>;
  }
  if (view.type === 'error') {
    return (
      <Card className="p-6 space-y-3" data-testid="billing-error">
        <p className="text-red-400">Unable to load billing information.</p>
        <Button onClick={() => retry()}>Retry</Button>
      </Card>
    );
  }
  if (view.type === 'permission') {
    return <Card className="p-6 text-zinc-400" data-testid="billing-permission">Only the workspace owner can manage billing.</Card>;
  }
  if (view.type === 'verify') {
    return (
      <Card className="p-6 space-y-3" data-testid="billing-verify">
        <h2 className="text-xl font-semibold">Verify your email</h2>
        <p className="text-zinc-400">Verify your email before starting a trial.</p>
      </Card>
    );
  }
  if (view.type === 'unconfigured') {
    return (
      <Card className="p-6 space-y-3" data-testid="billing-unconfigured">
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="text-zinc-400">{view.message}</p>
      </Card>
    );
  }
  if (view.type === 'no_plan') {
    return (
      <div className="space-y-6" data-testid="billing-no-plan">
        <Card className="p-6 space-y-2">
          <h2 className="text-xl font-semibold">No plan</h2>
          <p className="text-zinc-400">Choose a plan to start your 7-day free trial.</p>
        </Card>
        <PlanPicker
          plans={view.plans}
          configured={Boolean(view.data.stripeConfigured)}
          configurationMessage={view.data.environmentUnconfiguredMessage}
        />
      </div>
    );
  }

  const { data, lifecycle } = view;
  return (
    <div className="space-y-6" data-testid={`billing-state-${lifecycle}`}>
      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">{data.planName || data.selectedPlanKey}</h2>
        <p className="text-zinc-400 text-sm" data-testid="billing-lifecycle">{lifecycle}</p>
        <p className="text-zinc-400 text-sm">
          Status: {data.status}
          {data.billingInterval ? ` · ${data.billingInterval.toLowerCase()}` : ''}
          {lifecycle === 'TRIALING' && data.trialEndsAt ? ` · trial ends ${new Date(data.trialEndsAt).toLocaleDateString()}` : ''}
          {data.currentPeriodEnd ? ` · period ends ${new Date(data.currentPeriodEnd).toLocaleDateString()}` : ''}
          {typeof data.daysRemaining === 'number' ? ` · ${data.daysRemaining} days remaining` : ''}
        </p>
        {lifecycle === 'TRIALING' && <p className="text-sm text-zinc-300">No charge today. Your selected plan will renew automatically after the 7-day trial unless you cancel.</p>}
        {lifecycle === 'PAST_DUE' && <p className="text-amber-400 text-sm">Payment failed. Update your payment method to keep this plan after the grace period. Existing campaigns are not deleted.</p>}
        {lifecycle === 'UNPAID' && <p className="text-amber-400 text-sm">This workspace is restricted until billing is restored. Existing data is kept.</p>}
        {lifecycle === 'CANCEL_AT_PERIOD_END' && <p className="text-amber-400 text-sm">Access continues until the period ends. You will not be charged again.</p>}
        {data.billingWarning && lifecycle !== 'PAST_DUE' && <p className="text-amber-400 text-sm">{data.billingWarning}</p>}
        {data.hasCustomer && (
          <Button onClick={portal} data-testid="manage-billing">
            {lifecycle === 'PAST_DUE' ? 'Update Payment Method' : lifecycle === 'TRIALING' ? 'Cancel Trial / Manage Subscription' : 'Manage Billing'}
          </Button>
        )}
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Usage snapshot</h3>
        <p className="text-sm text-zinc-500 mb-3">
          Full meters live under Settings → Usage. Limits below come from the live billing summary.
        </p>
        <UsageRow label="Campaigns" used={data.usage.campaignsCreated} limit={data.usage.limits.maxCampaigns} />
        <UsageRow label="Active campaigns" used={data.usage.activeCampaigns} limit={data.usage.limits.maxActiveCampaigns} />
        <UsageRow label="Seats" used={data.usage.teamSeats} limit={data.usage.limits.maxTeamMembers} />
        <UsageRow label="Participants this period" used={data.usage.monthlyParticipants} limit={data.usage.limits.maxMonthlyParticipants} />
        <UsageRow label="Custom domains" used={data.usage.customDomains} limit={data.usage.limits.maxCustomDomains} />
      </Card>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-800 last:border-0 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span>{used} / {limit === null ? '∞' : limit}</span>
    </div>
  );
}

export function ApiPane() {
  const queryClient = useQueryClient();
  const entitlements = useQuery({
    queryKey: ['workspace-entitlements'],
    queryFn: () => workspaceApi.entitlements().then((r) => r.data.data),
  });
  const apiEnabled = entitlements.data?.entitlements?.apiEnabled !== false;
  const keys = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => workspaceApi.apiKeys().then((r) => r.data.data),
    enabled: !entitlements.isLoading && apiEnabled,
  });
  const [name, setName] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => workspaceApi.createApiKey(name),
    onSuccess: (response) => {
      setRevealed(response.data.data.key);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Copy this key now. It will not be shown again.');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not create API key'),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => workspaceApi.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
  });

  if (entitlements.isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-16 w-full bg-zinc-800 rounded animate-pulse" />
      </Card>
    );
  }
  if (entitlements.isError) {
    return <Card className="p-6 text-zinc-400">Couldn't load plan info. Try refreshing the page.</Card>;
  }
  if (!apiEnabled) {
    return <Card className="p-6 text-zinc-400">Public API keys are available on the Premium plan.</Card>;
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Team API keys</h2>
      <p className="text-sm text-zinc-400">
        Full keys are shown once. Prefix and last used remain visible. Versioned routes live under /api/v1.
      </p>
      {revealed && (
        <p className="font-mono text-sm break-all bg-zinc-950 border border-zinc-800 rounded-xl p-3">{revealed}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input label="Key name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button className="sm:self-end" onClick={() => create.mutate()} loading={create.isPending}>
          Create key
        </Button>
      </div>
      <div className="space-y-2">
        {(keys.data || []).map((key: any) => (
          <div key={key.id} className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 rounded-xl p-3 text-sm">
            <div>
              <p className="font-medium">{key.name}</p>
              <p className="text-zinc-500">
                {key.keyPrefix}… {key.revokedAt ? 'revoked' : `last used ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'never'}`}
              </p>
            </div>
            {!key.revokedAt && (
              <Button variant="danger" size="sm" onClick={() => revoke.mutate(key.id)}>Revoke</Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export { BillingPane as SettingsBillingPage };

