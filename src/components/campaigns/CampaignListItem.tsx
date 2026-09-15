import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Gift, Trophy, Users } from 'lucide-react';
import { Badge } from '../ui';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  SCHEDULED: 'info',
  PAUSED: 'warning',
  ENDED: 'danger',
};

export type CampaignListItemData = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { participants?: number; entries?: number };
};

interface CampaignListItemProps {
  campaign: CampaignListItemData;
  className?: string;
}

export function CampaignListItem({ campaign, className }: CampaignListItemProps) {
  const participants = campaign._count?.participants || 0;
  const entries = campaign._count?.entries || 0;

  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className={cn(
        'group flex items-center gap-3 px-3 py-3 sm:gap-3.5 sm:px-4',
        'transition-colors duration-150 hover:bg-zinc-800/40',
        className
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300"
        aria-hidden
      >
        <Gift className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium text-zinc-50">{campaign.title}</h3>
          <Badge variant={statusVariant[campaign.status] || 'default'} size="sm">
            {campaign.status}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Participants</span>
            {formatNumber(participants)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Entries</span>
            {formatNumber(entries)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Created</span>
            {formatRelativeTime(campaign.createdAt)}
          </span>
        </div>
      </div>

      <ArrowRight
        className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-300"
        aria-hidden
      />
    </Link>
  );
}
