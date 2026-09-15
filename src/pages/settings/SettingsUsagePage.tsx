import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button, PageSpinner } from '../../components/ui';
import { billingApi, planLimitMessage, workspaceApi } from '../../services/api';

function pct(used: number, limit: number | null) {
  if (limit === null || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}

function Meter({
  label,
  used,
  limit,
  hint,
}: {
  label: string;
  used: number;
  limit: number | null;
  hint?: string;
}) {
  const percent = pct(used, limit);
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return (
    <div className="space-y-2 py-4 border-b border-zinc-800 last:border-0">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span>
          {used} / {limit === null ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary-500 transition-all" style={{ width: `${limit === null ? 0 : percent}%` }} />
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>{limit === null ? 'Unlimited' : `${percent}% of limit used`}</span>
        {remaining !== null && <span className="text-emerald-400">{remaining} remaining</span>}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}

export function SettingsUsagePage() {
  const queryClient = useQueryClient();
  const current = useQuery({
    queryKey: ['workspace-current'],
    queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data),
  });
  const entitlements = useQuery({
    queryKey: ['workspace-entitlements'],
    queryFn: () => workspaceApi.entitlements().then((r) => r.data.data),
  });
  const canBill = Boolean(current.data?.permissions?.billing);
  const addons = useQuery({
    queryKey: ['billing-addons'],
    queryFn: () => billingApi.addons().then((r) => r.data.data),
    enabled: canBill,
  });

  const checkout = useMutation({
    mutationFn: (addonKey: string) => billingApi.checkoutAddon(addonKey),
    onSuccess: (response) => {
      const url = response.data?.data?.url;
      if (url) window.location.href = url;
      else toast.error('Checkout URL missing');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not start add-on checkout'),
  });

  if (entitlements.isLoading || current.isLoading) return <PageSpinner />;
  if (entitlements.isError || !entitlements.data) {
    return <Card className="p-6 text-red-400">Could not load usage.</Card>;
  }

  const usage = entitlements.data.usage;
  const ent = entitlements.data.entitlements;
  const periodFrom = usage.period?.from ? new Date(usage.period.from) : null;
  const periodTo = usage.period?.to ? new Date(usage.period.to) : ent.currentPeriodEnd ? new Date(ent.currentPeriodEnd) : null;
  const daysElapsed = periodFrom
    ? Math.max(1, Math.ceil((Date.now() - periodFrom.getTime()) / (24 * 60 * 60 * 1000)))
    : 1;
  const avgPerDay = Math.round((usage.monthlyParticipants / daysElapsed) * 100) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Usage</h2>
        <p className="text-zinc-400 mt-1">Track your current usage and limits from live workspace entitlements.</p>
      </div>

      <Card className="p-6 space-y-2">
        <h3 className="text-lg font-semibold">This period&apos;s usage</h3>
        <p className="text-sm text-zinc-500">
          {periodFrom && periodTo
            ? `${periodFrom.toLocaleDateString()} → ${periodTo.toLocaleDateString()}`
            : 'Billing period derived from subscription when available.'}
        </p>
        <Meter
          label="Entries / participants used"
          used={usage.monthlyParticipants}
          limit={usage.limits.maxMonthlyParticipants}
          hint={`Avg ${avgPerDay}/day · Resets ${periodTo ? periodTo.toLocaleDateString() : '—'}`}
        />
        <Meter label="Custom domains used" used={usage.customDomains} limit={usage.limits.maxCustomDomains} />
        <Meter
          label="Team members used"
          used={usage.teamSeats}
          limit={usage.limits.maxTeamMembers}
          hint={`${usage.pendingInvites || 0} pending invite(s) count toward seats`}
        />
        <Meter label="Campaigns created" used={usage.campaignsCreated} limit={usage.limits.maxCampaigns} />
        <Meter label="Active campaigns" used={usage.activeCampaigns} limit={usage.limits.maxActiveCampaigns} />
        <Meter label="Integrations" used={usage.integrations} limit={usage.limits.maxIntegrations} />
        <p className="text-sm text-zinc-400 pt-2">
          PromoApp enforces plan limits server-side when creating campaigns, inviting members, adding domains, and
          connecting integrations. Public entry acceptance follows existing campaign/entry engines — this page does not
          invent alternate limit behavior.
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Purchase add-ons</h3>
        <p className="text-sm text-zinc-400">
          Prices and Checkout use PromoApp Stripe configuration. Buttons stay disabled until a Stripe Price ID is set.
        </p>
        {!canBill && <p className="text-sm text-zinc-500">Only the workspace owner can purchase add-ons.</p>}
        <div className="grid md:grid-cols-3 gap-4">
          {(addons.data || []).filter((a: any) => a.key !== 'BUNDLE').map((addon: any) => (
            <div key={addon.key} className="border border-zinc-800 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold">{addon.name}</h4>
              <p className="text-sm text-zinc-400">{addon.description}</p>
              {addon.configured ? (
                <Button
                  disabled={!canBill}
                  loading={checkout.isPending}
                  onClick={() => checkout.mutate(addon.key)}
                >
                  Purchase Add-on
                </Button>
              ) : (
                <Button disabled variant="secondary">Not Configured</Button>
              )}
            </div>
          ))}
        </div>
        {(addons.data || []).filter((a: any) => a.key === 'BUNDLE').map((addon: any) => (
          <div key={addon.key} className="border border-primary-500/30 bg-primary-500/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold">{addon.name}</h4>
              <p className="text-sm text-zinc-400">{addon.description}</p>
            </div>
            {addon.configured ? (
              <Button disabled={!canBill} loading={checkout.isPending} onClick={() => checkout.mutate(addon.key)}>
                Purchase Bundle
              </Button>
            ) : (
              <Button disabled variant="secondary">Not Configured</Button>
            )}
          </div>
        ))}
        {canBill && addons.isSuccess && (addons.data || []).length === 0 && (
          <p className="text-sm text-zinc-500">No add-ons returned from the server.</p>
        )}
        {canBill && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['workspace-entitlements'] });
              void queryClient.invalidateQueries({ queryKey: ['billing-addons'] });
            }}
          >
            Refresh usage
          </Button>
        )}
      </Card>
    </div>
  );
}
