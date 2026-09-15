import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal, Select, Badge, PageSpinner, EmptyState, Checkbox, SearchField } from '../../../components/ui';
import { winnerApi, entryApi, exportApi, workspaceApi } from '../../../services/api';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { apiErrorMessage } from './constants';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { canManageWinners } from '../../../workspaces/permissions';

const ACTIVE_STATUSES = new Set(['SELECTED', 'CLAIMED']);

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  SELECTED: 'info',
  CLAIMED: 'success',
  DISQUALIFIED: 'danger',
  REMOVED: 'default',
  REPLACED: 'warning',
};

export function WinnersTab({
  campaignId,
  prizes,
}: {
  campaignId: string;
  prizes: any[];
}) {
  const queryClient = useQueryClient();
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
  const [page, setPage] = useState(1);
  const [showDraw, setShowDraw] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [disqualifyTarget, setDisqualifyTarget] = useState<any>(null);
  const [highRiskWarning, setHighRiskWarning] = useState<number | null>(null);
  const [drawForm, setDrawForm] = useState({
    prizeId: prizes[0]?.id || '',
    count: 1,
    excludePreviousWinners: true,
    excludeDisqualified: true,
    proceedDespiteHighRisk: false,
  });
  const [manualForm, setManualForm] = useState({ prizeId: prizes[0]?.id || '', participantId: '' });
  const [participantSearch, setParticipantSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['winners', campaignId, page],
    queryFn: () => winnerApi.getWinners(campaignId, { page, limit: 20 }),
  });

  const { data: drawsData } = useQuery({
    queryKey: ['winner-draws', campaignId],
    queryFn: () => winnerApi.getDraws(campaignId),
  });

  const { data: previewData } = useQuery({
    queryKey: ['draw-preview', campaignId, drawForm.prizeId, showDraw],
    queryFn: () => winnerApi.drawPreview(campaignId, drawForm.prizeId),
    enabled: showDraw && !!drawForm.prizeId,
  });

  const { data: participantResults } = useQuery({
    queryKey: ['winner-participant-search', campaignId, participantSearch],
    queryFn: () => entryApi.getCampaignParticipants(campaignId, { page: 1, limit: 10, search: participantSearch }),
    enabled: showManual && participantSearch.length >= 2,
  });

  const winners = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const draws = drawsData?.data?.data || [];
  const preview = previewData?.data?.data;
  const awardedByPrize = winners.reduce((acc: Record<string, number>, winner: any) => {
    if (ACTIVE_STATUSES.has(winner.status || (winner.claimed ? 'CLAIMED' : 'SELECTED'))) {
      acc[winner.prizeId] = (acc[winner.prizeId] || 0) + 1;
    }
    return acc;
  }, {});

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['winners', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['winner-draws', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaign-analytics', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['fraud-review', campaignId] });
  };

  const runDraw = (proceedDespiteHighRisk = false) =>
    winnerApi.drawWinners(campaignId, {
      prizeId: drawForm.prizeId,
      count: Number(drawForm.count) || 1,
      excludePreviousWinners: drawForm.excludePreviousWinners,
      excludeDisqualified: drawForm.excludeDisqualified,
      proceedDespiteHighRisk,
    });

  const drawMutation = useMutation({
    mutationFn: () => runDraw(drawForm.proceedDespiteHighRisk),
    onSuccess: () => {
      refreshAll();
      toast.success('Winners drawn');
      setShowDraw(false);
      setHighRiskWarning(null);
    },
    onError: (error: any) => {
      if (error?.response?.data?.error?.code === 'HIGH_RISK_PENDING') {
        setHighRiskWarning(error.response.data.error.details?.highRiskUnresolvedCount || 0);
        return;
      }
      toast.error(apiErrorMessage(error, 'Could not draw winners'));
    },
  });

  const proceedMutation = useMutation({
    mutationFn: () => runDraw(true),
    onSuccess: () => {
      refreshAll();
      toast.success('Winners drawn');
      setShowDraw(false);
      setHighRiskWarning(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not draw winners')),
  });

  const manualMutation = useMutation({
    mutationFn: () => winnerApi.manualSelect(campaignId, {
      participantId: manualForm.participantId,
      prizeId: manualForm.prizeId,
    }),
    onSuccess: () => {
      refreshAll();
      toast.success('Winner selected');
      setShowManual(false);
      setManualForm({ ...manualForm, participantId: '' });
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not select winner')),
  });

  const claimMutation = useMutation({
    mutationFn: (winnerId: string) => winnerApi.markClaimed(winnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winners', campaignId] });
      toast.success('Marked as claimed');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not mark claimed')),
  });

  const notifyMutation = useMutation({
    mutationFn: (winnerId: string) => winnerApi.notifyWinner(winnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winners', campaignId] });
      toast.success('Notification queued');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not notify winner')),
  });

  const removeMutation = useMutation({
    mutationFn: ({ redraw }: { redraw: boolean }) =>
      winnerApi.removeWinner(removeTarget.id, { redraw, reason: 'Removed by owner' }),
    onSuccess: () => {
      refreshAll();
      toast.success('Winner removed');
      setRemoveTarget(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not remove winner')),
  });

  const disqualifyMutation = useMutation({
    mutationFn: ({ redraw }: { redraw: boolean }) =>
      winnerApi.disqualifyWinner(disqualifyTarget.id, { redraw, reason: 'Disqualified by owner' }),
    onSuccess: () => {
      refreshAll();
      toast.success('Winner disqualified');
      setDisqualifyTarget(null);
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not disqualify winner')),
  });

  const exportCsv = async () => {
    try {
      const response = await exportApi.exportWinners(campaignId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winners_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Winners exported');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Export failed'));
    }
  };

  const selectedPrize = prizes.find((p) => p.id === drawForm.prizeId);
  const remaining = preview?.remaining ?? (selectedPrize
    ? Math.max(0, (selectedPrize.quantity || 0) - (awardedByPrize[selectedPrize.id] || 0))
    : 0);

  if (isLoading) return <PageSpinner />;
  if (isError) return <Card className="p-8 text-center text-zinc-400">Could not load winners.</Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="text-lg font-semibold">Winners</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          {canMutateWinners && (
            <>
              <Button variant="secondary" onClick={() => setShowManual(true)} disabled={prizes.length === 0}>
                Manual select
              </Button>
              <Button
                data-testid="draw-winner"
                onClick={() => {
                  setDrawForm({
                    prizeId: prizes[0]?.id || '',
                    count: 1,
                    excludePreviousWinners: true,
                    excludeDisqualified: true,
                    proceedDespiteHighRisk: false,
                  });
                  setHighRiskWarning(null);
                  setShowDraw(true);
                }}
                disabled={prizes.length === 0}
              >
                Draw Winner
              </Button>
            </>
          )}
        </div>
      </div>

      {prizes.length === 0 && (
        <Card className="p-4 text-sm text-zinc-400">Add a prize before drawing or selecting winners.</Card>
      )}

      {winners.length === 0 && (
        <EmptyState
          title="No winners selected"
          description="Draw or manually select a winner after the campaign has eligible participants."
        />
      )}

      {winners.length > 0 && (
        <div className="overflow-x-auto">
          <table className="ui-table">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="p-4">Participant</th>
                  <th className="p-4">Prize</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notified</th>
                  <th className="p-4">Selected</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {winners.map((winner: any) => {
                  const status = winner.status || (winner.claimed ? 'CLAIMED' : 'SELECTED');
                  const active = ACTIVE_STATUSES.has(status);
                  return (
                    <tr key={winner.id}>
                      <td className="p-4">
                        <p>{winner.participant?.name || '—'}</p>
                        <p className="text-xs text-zinc-500">{winner.participant?.email}</p>
                      </td>
                      <td className="p-4">{winner.prize?.name}</td>
                      <td className="p-4">{formatNumber(winner.participant?.totalPoints || 0)}</td>
                      <td className="p-4">
                        <Badge size="sm" variant={statusVariant[status] || 'default'}>{status}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge size="sm" variant={winner.notified ? 'success' : 'default'}>
                          {winner.notified ? 'Notified' : 'Not sent'}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-400">{formatDateTime(winner.selectedAt)}</td>
                      <td className="p-4">
                        {active && canMutateWinners && (
                          <div className="flex flex-wrap gap-1">
                            {status !== 'CLAIMED' && (
                              <Button size="sm" variant="secondary" data-testid="winner-claim" loading={claimMutation.isPending} onClick={() => claimMutation.mutate(winner.id)}>
                                Mark claimed
                              </Button>
                            )}
                            <Button size="sm" variant="secondary" loading={notifyMutation.isPending} onClick={() => notifyMutation.mutate(winner.id)}>
                              Notify
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setDisqualifyTarget(winner)}>
                              Disqualify
                            </Button>
                            <Button size="sm" variant="danger" data-testid="winner-remove" onClick={() => setRemoveTarget(winner)}>
                              Remove
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {draws.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-2" data-testid="draw-audit">Draw audit</h4>
          <div className="space-y-2 text-sm text-zinc-400">
            {draws.slice(0, 8).map((draw: any) => (
              <p key={draw.id}>
                {formatDateTime(draw.createdAt)} · {draw.algorithmVersion} · selected {draw.selectedCount}/{draw.requestedCount} · eligible {draw.eligibleParticipantCount} · weight {draw.totalEligibleWeight} · {draw.fraudFilterMode}
              </p>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showDraw} onClose={() => setShowDraw(false)} title="Draw winners">
        <div className="space-y-4">
          <Select
            label="Prize"
            options={prizes.map((prize) => ({ value: prize.id, label: `${prize.name} (qty ${prize.quantity})` }))}
            value={drawForm.prizeId}
            onChange={(e) => setDrawForm({ ...drawForm, prizeId: e.target.value })}
          />
          <Input
            label="Number of winners"
            type="number"
            min={1}
            max={Math.max(remaining, 1)}
            value={drawForm.count}
            onChange={(e) => setDrawForm({ ...drawForm, count: parseInt(e.target.value) || 1 })}
          />
          <p className="text-sm text-zinc-400">
            Remaining quantity: {remaining}
            {preview && ` · Eligible: ${preview.eligibleParticipantCount} · Weight: ${preview.totalEligibleWeight}`}
          </p>
          {(preview?.highRiskUnresolvedCount > 0 || highRiskWarning) && (
            <p className="text-sm text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {preview?.highRiskUnresolvedCount || highRiskWarning} unresolved high-risk participant(s). Review fraud or proceed anyway.
            </p>
          )}
          <Checkbox
            isSelected={drawForm.excludePreviousWinners}
            onChange={(checked) => setDrawForm({ ...drawForm, excludePreviousWinners: checked })}
          >
            Exclude previous winners
          </Checkbox>
          <Checkbox
            isSelected={drawForm.excludeDisqualified}
            onChange={(checked) => setDrawForm({ ...drawForm, excludeDisqualified: checked })}
          >
            Exclude disqualified participants (recommended)
          </Checkbox>
          {remaining <= 0 && <p className="text-sm text-red-400">No remaining quantity for this prize.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDraw(false)}>Cancel</Button>
            {highRiskWarning != null && (
              <Button variant="secondary" loading={proceedMutation.isPending} onClick={() => proceedMutation.mutate()}>
                Proceed anyway
              </Button>
            )}
            <Button
              data-testid="draw-confirm"
              loading={drawMutation.isPending}
              disabled={!drawForm.prizeId || remaining <= 0}
              onClick={() => drawMutation.mutate()}
            >
              Draw
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="Manual winner selection">
        <div className="space-y-4">
          <Select
            label="Prize"
            options={prizes.map((prize) => ({ value: prize.id, label: prize.name }))}
            value={manualForm.prizeId}
            onChange={(e) => setManualForm({ ...manualForm, prizeId: e.target.value })}
          />
          <SearchField
            label="Search participant"
            placeholder="Name or email"
            value={participantSearch}
            onChange={setParticipantSearch}
            onSubmit={setParticipantSearch}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(participantResults?.data?.data || []).map((row: any) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setManualForm({ ...manualForm, participantId: row.id })}
                className={`w-full text-left p-2 rounded-lg text-sm ${manualForm.participantId === row.id ? 'bg-primary-500/20' : 'bg-zinc-800'}`}
              >
                {row.name || '—'} · {row.email} · {row.totalPoints} pts
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowManual(false)}>Cancel</Button>
            <Button
              loading={manualMutation.isPending}
              disabled={!manualForm.participantId || !manualForm.prizeId}
              onClick={() => manualMutation.mutate()}
            >
              Select winner
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove winner">
        <p className="text-sm text-zinc-400 mb-4">
          Remove {removeTarget?.participant?.email} as a winner of {removeTarget?.prize?.name}? The record is kept as REMOVED.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>Cancel</Button>
          <Button variant="secondary" data-testid="winner-remove-redraw" loading={removeMutation.isPending} onClick={() => removeMutation.mutate({ redraw: true })}>Remove & redraw</Button>
          <Button variant="danger" loading={removeMutation.isPending} onClick={() => removeMutation.mutate({ redraw: false })}>Remove</Button>
        </div>
      </Modal>

      <Modal isOpen={!!disqualifyTarget} onClose={() => setDisqualifyTarget(null)} title="Disqualify winner">
        <p className="text-sm text-zinc-400 mb-4">
          Disqualify {disqualifyTarget?.participant?.email}? History is preserved. You can redraw a replacement.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDisqualifyTarget(null)}>Cancel</Button>
          <Button variant="secondary" loading={disqualifyMutation.isPending} onClick={() => disqualifyMutation.mutate({ redraw: false })}>Disqualify only</Button>
          <Button variant="danger" loading={disqualifyMutation.isPending} onClick={() => disqualifyMutation.mutate({ redraw: true })}>Disqualify & redraw</Button>
        </div>
      </Modal>
    </div>
  );
}
