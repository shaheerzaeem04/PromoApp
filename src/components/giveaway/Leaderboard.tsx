import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { publicApi } from '../../services/api';
import { formatNumber } from '../../utils/formatters';

interface LeaderboardProps {
  slug: string;
  compact?: boolean;
  enabled?: boolean;
}

export function Leaderboard({ slug, compact = false, enabled = true }: LeaderboardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', slug],
    queryFn: () => publicApi.getLeaderboard(slug, compact ? 5 : 10),
    enabled: !!slug && enabled,
  });

  if (!enabled) return null;

  const rows = data?.data?.data || [];

  return (
    <div className={compact ? 'p-3 rounded-lg bg-zinc-800 border border-zinc-700' : 'p-4 rounded-xl bg-zinc-900/50 border border-zinc-800'} data-testid="leaderboard">
      <h3 className={`font-semibold flex items-center gap-2 ${compact ? 'text-sm mb-2' : 'mb-3'}`}>
        <Trophy className="w-4 h-4 text-amber-400" />
        Leaderboard
      </h3>
      {isLoading && <p className="text-sm text-zinc-500">Loading ranks…</p>}
      {isError && <p className="text-sm text-zinc-500">Leaderboard is unavailable right now.</p>}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="text-sm text-zinc-500">No rankings yet. Be the first to earn points.</p>
      )}
      {rows.length > 0 && (
        <ol className="space-y-2">
          {rows.map((row: any) => (
            <li key={row.id} className="flex items-center justify-between text-sm gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-6 text-zinc-500">#{row.rank}</span>
                <span className="truncate">{row.displayName || 'Anonymous'}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="text-primary-400 font-medium">{formatNumber(row.totalPoints)} pts</span>
                {row.referrals > 0 && (
                  <span className="block text-xs text-zinc-500">{row.referrals} referrals</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
