import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { spinWheelApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { apiErrorMessage } from '../../pages/campaigns/detail/constants';

export function SpinHistory({
  participantId,
  token,
}: {
  participantId: string;
  token: string;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['spin-history', participantId],
    queryFn: () => spinWheelApi.getHistory(participantId, token, 8),
    enabled: !!participantId && !!token,
  });

  const claimMutation = useMutation({
    mutationFn: (resultId: string) => spinWheelApi.claimResult(resultId, participantId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-history', participantId] });
      toast.success('Reward claimed');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not claim reward')),
  });

  const rows = data?.data?.data || [];
  if (isLoading || rows.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
      <p className="font-medium text-sm">Your spins</p>
      {rows.map((row: any) => (
        <div key={row.id} className="flex items-center justify-between text-sm">
          <div>
            <p>{row.segment?.label || row.rewardType}</p>
            <p className="text-xs text-zinc-500">{formatDateTime(row.createdAt)}</p>
          </div>
          {row.claimed ? (
            <span className="text-xs text-emerald-400" data-testid="spin-claimed">Claimed</span>
          ) : row.rewardType && row.rewardType !== 'NO_WIN' && row.rewardType !== 'BONUS_ENTRIES' ? (
            <button
              type="button"
              className="text-xs text-primary-400 hover:underline disabled:opacity-50"
              data-testid="spin-claim"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate(row.id)}
            >
              Claim
            </button>
          ) : (
            <span className="text-xs text-zinc-500">{row.rewardType === 'NO_WIN' ? 'No prize' : 'Applied'}</span>
          )}
        </div>
      ))}
    </div>
  );
}
