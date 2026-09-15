import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Badge, Button, FilterSelect, PageSpinner, Modal, PageHeader } from '../../components/ui';
import type { FilterSelectOption } from '../../components/ui';
import { integrationsApi, publishingApi } from '../../services/api';

const PROVIDER_DOT: Record<string, string> = {
  MAILCHIMP: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.45)]',
  KLAVIYO: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
  CONVERTKIT: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.45)]',
  ACTIVECAMPAIGN: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.45)]',
  OMNISEND: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.45)]',
  BEEHIIV: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  MAILERLITE: 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
  GETRESPONSE: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]',
  DRIP: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.45)]',
  AWEBER: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.45)]',
  CAMPAIGN_MONITOR: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.45)]',
  BREVO: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]',
  MAILJET: 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.45)]',
  KEAP: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]',
  CUSTOM_WEBHOOK: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]',
  ZAPIER: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.45)]',
  GOOGLE_SHEETS: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
};

const STATUS: FilterSelectOption[] = [
  { value: '', label: 'All Statuses', hint: 'Show every delivery', dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]' },
  { value: 'SUCCESS', label: 'Success', hint: 'Delivered successfully', dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]' },
  { value: 'FAILED', label: 'Failed', hint: 'Delivery failed', dotClassName: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]' },
  { value: 'PENDING', label: 'Pending', hint: 'Waiting to send', dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]' },
  { value: 'RETRYING', label: 'Retrying', hint: 'Automatic retry in progress', dotClassName: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]' },
];

export function DeliveryLogPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState<any>(null);
  const filters = {
    provider: params.get('provider') || '',
    campaignId: params.get('campaignId') || '',
    status: params.get('status') || '',
  };

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['workspace-deliveries', filters],
    queryFn: () => integrationsApi.deliveries({
      provider: filters.provider || undefined,
      campaignId: filters.campaignId || undefined,
      status: filters.status || undefined,
    }),
  });

  const retry = useMutation({
    mutationFn: (row: any) => publishingApi.retryDelivery(row.campaignId, row.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deliveries'] });
      toast.success('Retry queued');
    },
    onError: () => toast.error('Could not retry this delivery'),
  });

  const rows = data?.data?.data || [];
  const providerOptions: FilterSelectOption[] = [
    {
      value: '',
      label: 'All Providers',
      hint: 'Every connected integration',
      dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
    },
    ...(integrations?.data?.data || []).map((row: any) => ({
      value: row.type as string,
      label: row.name as string,
      hint: String(row.type || '').replace(/_/g, ' '),
      dotClassName:
        PROVIDER_DOT[row.type as string] ||
        'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.35)]',
    })),
  ];

  const setFilter = (key: 'provider' | 'status', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader title="Delivery log" description="Outbound integration attempts. Secrets are never shown." />}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <FilterSelect
          options={providerOptions}
          value={filters.provider}
          onChange={(value) => setFilter('provider', value)}
          aria-label="Filter by provider"
          data-testid="delivery-provider-filter"
        />
        <FilterSelect
          options={STATUS}
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          aria-label="Filter by status"
          data-testid="delivery-status-filter"
        />
        {!embedded && (
          <Link to="/integrations" className="text-sm text-primary-400 self-center">Back to integrations</Link>
        )}
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="ui-table ui-table--page table-auto w-full text-sm" data-testid="delivery-log">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Campaign</th>
                <th>Event</th>
                <th>Participant</th>
                <th>Status</th>
                <th>Attempt</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.integration?.name || row.integration?.type}</td>
                  <td>{row.campaignTitle || row.campaignId.slice(0, 8)}</td>
                  <td>{row.event}</td>
                  <td>{row.participantEmail || '—'}</td>
                  <td>
                    <Badge variant={row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td>{row.attempt}</td>
                  <td className="text-zinc-500">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>Details</Button>
                    {row.retryable && (
                      <Button size="sm" variant="ghost" onClick={() => retry.mutate(row)} loading={retry.isPending}>Retry</Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-zinc-500">No deliveries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Delivery details" size="md">
        {detail && (
          <div className="space-y-2 text-sm">
            <p>Event: {detail.event}</p>
            <p>HTTP: {detail.httpStatus ?? 'n/a'}</p>
            <p>Host: {detail.destinationHost || 'n/a'}</p>
            <p>Delivery ID: {detail.deliveryId}</p>
            {detail.error && <p className="text-red-400">Error: {detail.error}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
