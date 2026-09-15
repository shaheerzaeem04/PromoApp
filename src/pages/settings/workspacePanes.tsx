import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components/ui';
import { SettingsSection } from './SettingsSection';
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
    return <p className="text-sm text-zinc-400" data-testid="billing-loading">Loading billing…</p>;
  }
  if (view.type === 'error') {
    return (
      <SettingsSection title="Billing" data-testid="billing-error">
        <p className="text-red-400">Unable to load billing information.</p>
        <Button onClick={() => retry()}>Retry</Button>
      </SettingsSection>
    );
  }
  if (view.type === 'permission') {
    return (
      <p className="text-sm text-zinc-400" data-testid="billing-permission">
        Only the workspace owner can manage billing.
      </p>
    );
  }
  if (view.type === 'verify') {
    return (
      <SettingsSection
        title="Verify your email"
        description="Verify your email before starting a trial."
        data-testid="billing-verify"
      />
    );
  }
  if (view.type === 'unconfigured') {
    return (
      <SettingsSection title="Billing" description={view.message} data-testid="billing-unconfigured" />
    );
  }
  if (view.type === 'no_plan') {
    return (
      <div data-testid="billing-no-plan">
        <SettingsSection title="No plan" description="Choose a plan to start your 7-day free trial." />
        <div className="mt-8">
          <PlanPicker
            plans={view.plans}
            configured={Boolean(view.data.stripeConfigured)}
            configurationMessage={view.data.environmentUnconfiguredMessage}
          />
        </div>
      </div>
    );
  }

  const { data, lifecycle } = view;
  return (
    <div data-testid={`billing-state-${lifecycle}`}>
      <SettingsSection
        title={data.planName || data.selectedPlanKey}
        description={
          <>
            <span data-testid="billing-lifecycle">{lifecycle}</span>
            {' · '}
            Status: {data.status}
            {data.billingInterval ? ` · ${data.billingInterval.toLowerCase()}` : ''}
            {lifecycle === 'TRIALING' && data.trialEndsAt ? ` · trial ends ${new Date(data.trialEndsAt).toLocaleDateString()}` : ''}
            {data.currentPeriodEnd ? ` · period ends ${new Date(data.currentPeriodEnd).toLocaleDateString()}` : ''}
            {typeof data.daysRemaining === 'number' ? ` · ${data.daysRemaining} days remaining` : ''}
          </>
        }
      >
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
      </SettingsSection>
      <SettingsSection
        title="Usage snapshot"
        description="Full meters live under Settings → Usage. Limits below come from the live billing summary."
      >
        <div>
          <UsageRow label="Campaigns" used={data.usage.campaignsCreated} limit={data.usage.limits.maxCampaigns} />
          <UsageRow label="Active campaigns" used={data.usage.activeCampaigns} limit={data.usage.limits.maxActiveCampaigns} />
          <UsageRow label="Seats" used={data.usage.teamSeats} limit={data.usage.limits.maxTeamMembers} />
          <UsageRow label="Participants this period" used={data.usage.monthlyParticipants} limit={data.usage.limits.maxMonthlyParticipants} />
          <UsageRow label="Custom domains" used={data.usage.customDomains} limit={data.usage.limits.maxCustomDomains} />
        </div>
      </SettingsSection>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div className="settings-pref">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm tabular-nums">
        {used} / {limit === null ? '∞' : limit}
      </span>
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
    return <p className="text-sm text-zinc-400">Loading API keys…</p>;
  }
  if (entitlements.isError) {
    return <p className="text-sm text-zinc-400">Couldn't load plan info. Try refreshing the page.</p>;
  }
  if (!apiEnabled) {
    return (
      <SettingsSection
        title="Team API keys"
        description="Public API keys are available on the Premium plan."
      />
    );
  }

  return (
    <SettingsSection
      title="Team API keys"
      description="Full keys are shown once. Prefix and last used remain visible. Versioned routes live under /api/v1."
    >
      {revealed && <p className="settings-secret">{revealed}</p>}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1 min-w-0">
          <Input label="Key name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button onClick={() => create.mutate()} loading={create.isPending}>
          Create key
        </Button>
      </div>
      <div>
        {(keys.data || []).map((key: any) => (
          <div key={key.id} className="settings-row">
            <div>
              <p className="font-medium">{key.name}</p>
              <p className="text-sm text-zinc-500">
                {key.keyPrefix}… {key.revokedAt ? 'revoked' : `last used ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'never'}`}
              </p>
            </div>
            {!key.revokedAt && (
              <Button variant="danger" size="sm" onClick={() => revoke.mutate(key.id)}>Revoke</Button>
            )}
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

export { BillingPane as SettingsBillingPage };

