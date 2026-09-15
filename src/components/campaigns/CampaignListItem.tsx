import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';
import { Badge } from '../ui';
import { formatNumber, formatDate, formatRelativeTime } from '../../utils/formatters';
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
  createdAt?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  _count?: { participants?: number; entries?: number };
};

interface CampaignListItemProps {
  campaign: CampaignListItemData;
  className?: string;
  actions?: ReactNode;
  'data-testid'?: string;
}

export function CampaignListItem({
  campaign,
  className,
  actions,
  'data-testid': testId,
}: CampaignListItemProps) {
  const participants = campaign._count?.participants || 0;
  const entries = campaign._count?.entries || 0;
  const meta: string[] = [
    `${formatNumber(participants)} participants`,
    `${formatNumber(entries)} entries`,
  ];
  if (campaign.startDate) {
    meta.push(`${formatDate(campaign.startDate)} – ${campaign.endDate ? formatDate(campaign.endDate) : 'Open'}`);
  } else if (campaign.createdAt) {
    meta.push(formatRelativeTime(campaign.createdAt));
  }

  return (
    <div
      data-testid={testId}
      className={cn('campaign-row group flex items-center gap-2 sm:gap-3', className)}
    >
      <Link
        to={`/campaigns/${campaign.id}`}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg px-3 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70"
      >
        <Gift className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-zinc-50" data-testid="campaign-title">
              {campaign.title}
            </h3>
            <Badge variant={statusVariant[campaign.status] || 'default'} size="sm">
              {campaign.status}
            </Badge>
          </div>
          {campaign.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">{campaign.description}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">{meta.join(' · ')}</p>
        </div>
        <ArrowRight className="campaign-row-icon mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 opacity-40" aria-hidden />
      </Link>
      {actions ? <div className="shrink-0 pr-1.5">{actions}</div> : null}
    </div>
  );
}
