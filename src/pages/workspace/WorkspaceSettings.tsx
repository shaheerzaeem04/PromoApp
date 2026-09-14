import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Input, PageHeader } from '../../components/ui';
import { billingApi, planLimitMessage, workspaceApi } from '../../services/api';
import { PlanPicker } from '../../components/billing/PlanPicker';

type Tab = 'general' | 'team' | 'billing' | 'api' | 'danger';

export function WorkspaceSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || (params.get('checkout') ? 'billing' : 'general');

  const setTab = (next: Tab) => {
    const copy = new URLSearchParams(params);
    copy.set('tab', next);
    setParams(copy, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Workspace" description="Team, billing, and workspace settings — separate from your user profile." />
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {(['general', 'team', 'billing', 'api', 'danger'] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            data-testid={`workspace-tab-${item}`}
            className={`px-3 py-2 text-sm capitalize ${
              tab === item ? 'border-b-2 border-primary-500 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === 'general' && <GeneralPane />}
      {tab === 'team' && <TeamPane />}
      {tab === 'billing' && <BillingPane />}
      {tab === 'api' && <ApiPane />}
      {tab === 'danger' && <DangerPane />}
    </div>
  );
}

function GeneralPane() {
  const { data } = useQuery({ queryKey: ['workspace-current'], queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data) });
  const [name, setName] = useState('');
  useEffect(() => {
    if (data?.name) setName(data.name);
  }, [data?.name]);
  const mutation = useMutation({
    mutationFn: () => workspaceApi.update(name),
    onSuccess: () => toast.success('Workspace updated'),
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not update workspace'),
  });
  if (!data) return null;
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">General</h2>
      <Input label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} disabled={!data.permissions?.update} />
      <p className="text-sm text-zinc-500">Slug: {data.slug}</p>
      {data.permissions?.update && (
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>Save</Button>
      )}
    </Card>
  );
}

function TeamPane() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['workspace-members'], queryFn: () => workspaceApi.members().then((r) => r.data.data) });
  const current = useQuery({ queryKey: ['workspace-current'], queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data) });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const invite = useMutation({
    mutationFn: () => workspaceApi.invite(email, role),
    onSuccess: () => {
      toast.success('Invitation sent');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not send invite'),
  });

  if (!data) return null;
  const canInvite = current.data?.permissions?.invite;
  const canManage = current.data?.permissions?.manageMembers;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Team</h2>
          <p className="text-sm text-zinc-400">
            {data.seats.used} / {data.seats.limit ?? '∞'} seats used
          </p>
        </div>
        {data.seats.limit && data.seats.used >= data.seats.limit && (
          <p className="text-amber-400 text-sm mb-4">Seat limit reached. Upgrade to invite more people.</p>
        )}
        {data.members.length <= 1 && (
          <p className="text-sm text-zinc-400 mb-4">You’re the only member. Invite a teammate for shared access, or skip this if you work alone.</p>
        )}
        {canInvite && (
          <div className="flex gap-3 mb-6">
            <Input placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="invite-email" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ADMIN')}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} data-testid="invite-submit">Invite</Button>
          </div>
        )}
        <div className="space-y-2">
          {data.members.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-zinc-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-zinc-400">{member.role}</span>
                {canManage && member.role !== 'OWNER' && (
                  <>
                    <select
                      value={member.role}
                      onChange={async (e) => {
                        try {
                          await workspaceApi.updateMember(member.id, e.target.value as 'ADMIN' | 'MEMBER');
                          queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
                        } catch (error: any) {
                          toast.error(planLimitMessage(error) || 'Could not change role');
                        }
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await workspaceApi.removeMember(member.id);
                          queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
                        } catch (error: any) {
                          toast.error(planLimitMessage(error) || 'Could not remove member');
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {data.invitations?.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Pending invitations</h3>
          {data.invitations.map((inviteItem: any) => (
            <div key={inviteItem.id} className="flex items-center justify-between py-2">
              <div>
                <p>{inviteItem.email}</p>
                <p className="text-sm text-zinc-500">{inviteItem.role} · expires {new Date(inviteItem.expiresAt).toLocaleDateString()}</p>
              </div>
              {canInvite && (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={async () => { await workspaceApi.resendInvite(inviteItem.id); toast.success('Resent'); }}>Resend</Button>
                  <Button variant="ghost" onClick={async () => { await workspaceApi.revokeInvite(inviteItem.id); queryClient.invalidateQueries({ queryKey: ['workspace-members'] }); }}>Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

type BillingView =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'permission' }
  | { type: 'verify' }
  | { type: 'unconfigured'; message?: string }
  | { type: 'no_plan'; data: any; plans: any }
  | { type: 'active'; data: any; lifecycle: string };

function resolveBillingView(current: any, billing: any, plans: any): BillingView {
  // Permissions unknown — keep a single loading surface (avoids empty/permission flash on reload).
  if (current.isPending || !current.data) {
    if (current.isError) return { type: 'error' };
    return { type: 'loading' };
  }

  if (current.isError) return { type: 'error' };

  if (!current.data.permissions?.billing) return { type: 'permission' };

  // Owner path: wait until billing + plans settle; missing data is still loading, never "empty".
  const billingSettled = billing.isSuccess || billing.isError;
  const plansSettled = plans.isSuccess || plans.isError;
  if (!billingSettled || !plansSettled || billing.isPending || plans.isPending) {
    return { type: 'loading' };
  }

  if (billing.isError || plans.isError || !billing.data || !plans.data) {
    if (billing.isError) {
      const status = (billing.error as any)?.response?.status;
      console.error('billing.load_failed', { status, code: (billing.error as any)?.response?.data?.error?.code });
    }
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

function BillingPane() {
  // Fetch in parallel with PlanGate/TrialBanner cache — no canBill waterfall.
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
        <h3 className="font-semibold mb-3">Usage</h3>
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

function ApiPane() {
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

  // 1. Loading — don't assume entitled, don't assume restricted. Show nothing conclusive.
  if (entitlements.isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-16 w-full bg-zinc-800 rounded animate-pulse" />
      </Card>
    );
  }

  // 2. Error — fail closed on plan info, don't fall through to the full pane.
  if (entitlements.isError) {
    return (
      <Card className="p-6 text-zinc-400">
        Couldn't load plan info. Try refreshing the page.
      </Card>
    );
  }

  // 3. Known and restricted.
  if (!apiEnabled) {
    return (
      <Card className="p-6 text-zinc-400">
        Public API keys are available on the Premium plan.
      </Card>
    );
  }

  // 4. Known and entitled — full pane.
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">API keys</h2>
      <p className="text-sm text-zinc-400">
        Full keys are shown once. Prefix and last used remain visible. Versioned routes live under /api/v1.
      </p>
      {revealed && (
        <p className="font-mono text-sm break-all bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          {revealed}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input label="Key name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button className="sm:self-end" onClick={() => create.mutate()} loading={create.isPending}>
          Create key
        </Button>
      </div>
      <div className="space-y-2">
        {(keys.data || []).map((key: any) => (
          <div
            key={key.id}
            className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 rounded-xl p-3 text-sm"
          >
            <div>
              <p className="font-medium">{key.name}</p>
              <p className="text-zinc-500">
                {key.keyPrefix}… {key.revokedAt ? 'revoked' : `last used ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'never'}`}
              </p>
            </div>
            {!key.revokedAt && (
              <Button variant="danger" size="sm" onClick={() => revoke.mutate(key.id)}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
function DangerPane() {
  const current = useQuery({ queryKey: ['workspace-current'], queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data) });
  const [name, setName] = useState('');
  const mutation = useMutation({
    mutationFn: () => workspaceApi.deleteWorkspace(name),
    onSuccess: (response) => {
      toast.success(`Workspace scheduled for deletion on ${new Date(response.data.data.deletionScheduledAt).toLocaleDateString()}`);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error?.message || 'Could not delete workspace'),
  });
  if (current.data && current.data.role !== 'OWNER') {
    return <Card className="p-6 text-zinc-400">Only the owner can delete this workspace.</Card>;
  }
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-red-400">Delete workspace</h2>
      <p className="text-sm text-zinc-400">
        Soft-deletes this workspace after you type its name. Campaigns, participants, files, API keys, domains, and integrations are disabled immediately and purged after the retention window. Active Stripe subscriptions cancel at period end. Paid customer data is not destroyed on cancel.
      </p>
      <Input label="Type the workspace name" value={name} onChange={(e) => setName(e.target.value)} />
      <Button variant="danger" onClick={() => mutation.mutate()} loading={mutation.isPending}>Schedule deletion</Button>
    </Card>
  );
}

