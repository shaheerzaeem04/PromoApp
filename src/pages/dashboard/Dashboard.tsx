import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Gift,
  Users,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Badge, Button, PageSpinner, PageHeader, EmptyState, Stat } from '../../components/ui';
import { campaignApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';
import { OnboardingChecklist } from '../../components/onboarding/OnboardingChecklist';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  SCHEDULED: 'info',
  PAUSED: 'warning',
  ENDED: 'danger',
};

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', 'recent'],
    queryFn: () => campaignApi.getAll({ limit: 5 }),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => campaignApi.getDashboardSummary(),
  });

  const totals = summary?.data?.data;

  if (isLoading || loadingSummary) return <PageSpinner />;

  const rows = campaigns?.data.data || [];

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        description="Campaign health at a glance."
        actions={
          <Link to="/campaigns/new">
            <Button>
              <Plus className="w-4 h-4" />
              New campaign
            </Button>
          </Link>
        }
      />

      <OnboardingChecklist />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-1">
        <Stat label="Campaigns" value={formatNumber(totals?.totalCampaigns || 0)} />
        <Stat label="Live" value={formatNumber(totals?.activeCampaigns || 0)} />
        <Stat label="Participants" value={formatNumber(totals?.totalParticipants || 0)} />
        <Stat label="Entries" value={formatNumber(totals?.totalEntries || 0)} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recent campaigns</h2>
          <Link to="/campaigns" className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {rows.length > 0 ? (
          <div className="divide-y divide-zinc-800/70 border-t border-zinc-800/70">
            {rows.map((campaign: any) => (
              <Link
                key={campaign.id}
                to={`/campaigns/${campaign.id}`}
                className="flex items-center gap-4 py-4 hover:bg-zinc-900/40 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{campaign.title}</h3>
                    <Badge variant={statusColors[campaign.status]} size="sm">{campaign.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {formatNumber(campaign._count.participants)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatRelativeTime(campaign.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Gift className="w-5 h-5" />}
            title="No campaigns yet"
            description="Create a giveaway, add a prize and an entry action, then publish."
            action={
              <Link to="/campaigns/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create campaign
                </Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
