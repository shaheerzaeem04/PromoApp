import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Badge, PageSpinner, EmptyState } from '../../../components/ui';
import { winnerApi, campaignApi, workspaceApi } from '../../../services/api';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { apiErrorMessage } from './constants';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { canManageWinners } from '../../../workspaces/permissions';

const riskVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
};

export function FraudTab({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const workspaceRole = useWorkspaceStore((s) => {
    const id = s.activeWorkspaceId;
    return s.workspaces.find((w) => w.id === id)?.role;
  });
  const { data: workspaceList } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceApi.list().then((r) => r.data.data),
  });
  const listedRole = workspaceList?.find((w: { id: string }) => w.id === useWorkspaceStore.getState().activeWorkspaceId)?.role;
  const canMutateWinners = canManageWinners(listedRole || workspaceRole);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fraud-review', campaignId],
    queryFn: () => winnerApi.getFraudReview(campaignId),
  });

  const review = data?.data?.data;
  const rows = review?.participants || [];

  const mutation = useMutation({
    mutationFn: ({ participantId, status }: { participantId: string; status: 'CLEARED' | 'FLAGGED' | 'DISQUALIFIED' }) =>
      winnerApi.updateFraudReview(campaignId, participantId, { status, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-review', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['winners', campaignId] });
      toast.success('Review updated');
      setNote('');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not update review')),
  });

  const exportFraud = async () => {
    try {
      const response = await campaignApi.exportAnalytics(campaignId, 'fraud');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud_review_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Export failed'));
    }
  };

  if (isLoading) return <PageSpinner />;
  if (isError) return <Card className="p-8 text-center text-zinc-400">Could not load fraud review.</Card>;

  return (
    <div className="space-y-4" data-testid="fraud-review">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Fraud review
          </h3>
          <p className="text-sm text-zinc-400">
            {review?.highRiskUnresolved || 0} unresolved high-risk · {review?.flaggedCount || 0} flagged of {review?.totalParticipants || 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Medium risk is not auto-blocked. Default draw policy excludes only explicitly disqualified participants.
          </p>
        </div>
        <Button variant="secondary" onClick={exportFraud}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Input
        label="Review note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason for flag, clear, or disqualify"
      />

      {rows.length === 0 && (
        <EmptyState
          title="No participants to review"
          description="Fraud signals appear after people enter this campaign."
        />
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="ui-table">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="p-4">Participant</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Entries</th>
                  <th className="p-4">Referrals</th>
                  <th className="p-4">Risk</th>
                  <th className="p-4">Review</th>
                  <th className="p-4">Signals</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((row: any) => (
                  <tr key={row.id}>
                    <td className="p-4">
                      <p>{row.name || '—'}</p>
                      <p className="text-xs text-zinc-500">{row.email}</p>
                      <p className="text-xs text-zinc-600">{formatDateTime(row.createdAt)}</p>
                    </td>
                    <td className="p-4">{formatNumber(row.eligiblePoints)}</td>
                    <td className="p-4">{row.entryCount}</td>
                    <td className="p-4">{row.referralCount}</td>
                    <td className="p-4">
                      <Badge size="sm" variant={riskVariant[row.assessment?.level] || 'default'}>
                        {row.assessment?.level}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge size="sm" variant={row.fraudReviewStatus === 'DISQUALIFIED' ? 'danger' : row.fraudReviewStatus === 'FLAGGED' ? 'warning' : 'default'}>
                        {row.fraudReviewStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-zinc-400 max-w-xs">
                      {row.sameIp && <span className="mr-1">Same-IP</span>}
                      {row.burst && <span className="mr-1">Burst</span>}
                      {row.invalidatedEntries > 0 && <span className="mr-1">{row.invalidatedEntries} invalidated</span>}
                      <p>{(row.assessment?.reasons || []).join('; ')}</p>
                    </td>
                    <td className="p-4">
                      {canMutateWinners && (
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="secondary" data-testid="fraud-clear" onClick={() => mutation.mutate({ participantId: row.id, status: 'CLEARED' })}>Clear</Button>
                        <Button size="sm" variant="secondary" data-testid="fraud-flag" onClick={() => mutation.mutate({ participantId: row.id, status: 'FLAGGED' })}>Flag</Button>
                        <Button size="sm" variant="danger" data-testid="fraud-disqualify" onClick={() => mutation.mutate({ participantId: row.id, status: 'DISQUALIFIED' })}>Disqualify</Button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
