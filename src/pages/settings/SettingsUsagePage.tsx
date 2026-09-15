import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, PageSpinner } from '../../components/ui';
import { SettingsSection } from './SettingsSection';
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
    <div className="space-y-2 py-4 border-b border-zinc-800/50 last:border-0">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          {used} / {limit === null ? '∞' : limit}
        </span>
      </div>
      <div className="settings-meter-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
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
    return <p className="text-sm text-red-400">Could not load usage.</p>;
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
    <div>
      <SettingsSection
        title="This period's usage"
        description={
          periodFrom && periodTo
            ? `${periodFrom.toLocaleDateString()} → ${periodTo.toLocaleDateString()}`
            : 'Billing period derived from subscription when available.'
        }
      >
        <div>
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
        </div>
        <p className="text-sm text-zinc-400">
          PromoApp enforces plan limits server-side when creating campaigns, inviting members, adding domains, and
          connecting integrations. Public entry acceptance follows existing campaign/entry engines — this page does not
          invent alternate limit behavior.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Purchase add-ons"
        description="Prices and Checkout use PromoApp Stripe configuration. Buttons stay disabled until a Stripe Price ID is set."
      >
        {!canBill && <p className="text-sm text-zinc-500">Only the workspace owner can purchase add-ons.</p>}
        <div>
          {(addons.data || []).filter((a: any) => a.key !== 'BUNDLE').map((addon: any) => (
            <div key={addon.key} className="settings-row">
              <div className="min-w-0">
                <h4 className="font-semibold">{addon.name}</h4>
                <p className="text-sm text-zinc-400 mt-0.5">{addon.description}</p>
              </div>
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
          <div key={addon.key} className="settings-row">
            <div className="min-w-0">
              <h4 className="font-semibold">{addon.name}</h4>
              <p className="text-sm text-zinc-400 mt-0.5">{addon.description}</p>
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
      </SettingsSection>
    </div>
  );
}
