import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Input, Modal, PageSpinner, EmptyState, FilterSelect } from '../../../components/ui';
import type { FilterSelectOption } from '../../../components/ui';
import { entryApi } from '../../../services/api';
import { formatDateTime } from '../../../utils/formatters';
import { apiErrorMessage, verificationLabel } from './constants';

const STATUS_OPTIONS: FilterSelectOption[] = [
  {
    value: '',
    label: 'All Statuses',
    hint: 'Show every entry',
    dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
  },
  {
    value: 'verified',
    label: 'Verified',
    hint: 'Confirmed completions',
    dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]',
  },
  {
    value: 'honor',
    label: 'Honor system',
    hint: 'Unverified entries',
    dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  },
  {
    value: 'invalidated',
    label: 'Invalidated',
    hint: 'Removed from scoring',
    dotClassName: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]',
  },
];

export function EntriesTab({ campaignId, actions }: { campaignId: string; actions: any[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState('');
  const [status, setStatus] = useState('');
  const [invalidateTarget, setInvalidateTarget] = useState<any>(null);
  const [reason, setReason] = useState('');

  const params: Record<string, any> = { page, limit: 20 };
  if (actionId) params.actionId = actionId;
  if (status === 'verified') params.verified = 'true';
  if (status === 'honor') params.verified = 'false';
  if (status === 'invalidated') params.invalidated = 'true';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign-entries', campaignId, page, actionId, status],
    queryFn: () => entryApi.getCampaignEntries(campaignId, params),
  });

  const invalidate = useMutation({
    mutationFn: () => entryApi.invalidateEntry(invalidateTarget.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-entries', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-participants', campaignId] });
      toast.success('Entry invalidated');
      setInvalidateTarget(null);
      setReason('');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not invalidate entry')),
  });

  const actionOptions = useMemo<FilterSelectOption[]>(
    () => [
      {
        value: '',
        label: 'All Actions',
        hint: 'Every entry action',
        dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]',
      },
      ...actions.map((action) => ({
        value: action.id as string,
        label: action.title as string,
        hint: action.type ? String(action.type).replace(/_/g, ' ') : undefined,
        dotClassName: 'bg-zinc-400',
      })),
    ],
    [actions]
  );

  const rows = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <FilterSelect
          className="sm:w-56"
          options={actionOptions}
          value={actionId}
          onChange={(value) => {
            setActionId(value);
            setPage(1);
          }}
          aria-label="Filter by action"
          data-testid="entries-action-filter"
        />
        <FilterSelect
          className="sm:w-56"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          aria-label="Filter by status"
          data-testid="entries-status-filter"
        />
      </div>

      {isLoading && <PageSpinner />}
      {isError && <Card className="p-8 text-center text-zinc-400">Could not load entries.</Card>}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          title="No entries yet"
          description="Entries appear after someone signs up or completes an action."
        />
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="ui-table">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="p-4">Participant</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="p-4">
                      <p>{entry.participant?.name || '—'}</p>
                      <p className="text-xs text-zinc-500">{entry.participant?.email}</p>
                    </td>
                    <td className="p-4">{entry.action?.title}</td>
                    <td className="p-4">{entry.points}</td>
                    <td className="p-4">
                      <Badge size="sm" variant={entry.invalidated ? 'danger' : entry.verified ? 'success' : 'warning'}>
                        {verificationLabel(entry)}
                      </Badge>
                    </td>
                    <td className="p-4 text-zinc-400">{entry.verificationMethod || '—'}</td>
                    <td className="p-4 text-zinc-400">{formatDateTime(entry.createdAt)}</td>
                    <td className="p-4">
                      {!entry.invalidated && (
                        <Button size="sm" variant="danger" onClick={() => setInvalidateTarget(entry)}>
                          Invalidate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between p-4 text-sm text-zinc-400">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={!pagination.hasMore} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!invalidateTarget} onClose={() => setInvalidateTarget(null)} title="Invalidate entry">
        <p className="text-sm text-zinc-400 mb-4">
          This permanently marks the entry as invalid. Winner and stats calculations will use the updated backend state.
        </p>
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Fraud, duplicate, or other reason"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setInvalidateTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={invalidate.isPending} disabled={!reason.trim()} onClick={() => invalidate.mutate()}>
            Invalidate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
