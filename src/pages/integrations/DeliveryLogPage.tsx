import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Badge, Button, FilterSelect, PageSpinner, Modal, PageHeader } from '../../components/ui';
import type { FilterSelectOption } from '../../components/ui';
import { integrationsApi, publishingApi } from '../../services/api';

const STATUS: FilterSelectOption[] = [
  { value: '', label: 'All Statuses', hint: 'Show every delivery', dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]' },
  { value: 'SUCCESS', label: 'Success', hint: 'Delivered successfully', dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]' },
  { value: 'FAILED', label: 'Failed', hint: 'Delivery failed', dotClassName: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]' },
  { value: 'PENDING', label: 'Pending', hint: 'Waiting to send', dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]' },
  { value: 'RETRYING', label: 'Retrying', hint: 'Automatic retry in progress', dotClassName: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)]' },
];

export function DeliveryLogPage() {
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
      hint: row.type as string,
      dotClassName: 'bg-zinc-400',
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
      <PageHeader title="Delivery log" description="Outbound integration attempts. Secrets are never shown." />
      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
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
        <Link to="/integrations" className="text-sm text-primary-400 self-center">Back to integrations</Link>
      </Card>
      {isLoading ? (
        <PageSpinner />
      ) : (
        <Card className="overflow-x-auto" padding="none">
          <table className="w-full text-sm" data-testid="delivery-log">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="p-3">Provider</th>
                <th className="p-3">Campaign</th>
                <th className="p-3">Event</th>
                <th className="p-3">Participant</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attempt</th>
                <th className="p-3">When</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="p-3">{row.integration?.name || row.integration?.type}</td>
                  <td className="p-3">{row.campaignTitle || row.campaignId.slice(0, 8)}</td>
                  <td className="p-3">{row.event}</td>
                  <td className="p-3">{row.participantEmail || '—'}</td>
                  <td className="p-3">
                    <Badge variant={row.status === 'SUCCESS' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="p-3">{row.attempt}</td>
                  <td className="p-3 text-zinc-500">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>Details</Button>
                    {row.retryable && (
                      <Button size="sm" variant="ghost" onClick={() => retry.mutate(row)} loading={retry.isPending}>Retry</Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">No deliveries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
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
