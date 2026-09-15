import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Plus, ArrowRight } from 'lucide-react';
import { Button, EmptyState, PageSpinner, Stat } from '../../components/ui';
import { CampaignListItem, type CampaignListItemData } from '../../components/campaigns/CampaignListItem';
import { campaignApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatNumber } from '../../utils/formatters';
import { OnboardingChecklist } from '../../components/onboarding/OnboardingChecklist';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function healthCopy(liveCount: number): string {
  if (liveCount <= 0) return 'No campaigns are live — publish when you are ready.';
  if (liveCount === 1) return '1 campaign is live and accepting entries.';
  return `${liveCount} campaigns are live and accepting entries.`;
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', 'recent'],
    queryFn: () => campaignApi.getAll({ limit: 5 }),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => campaignApi.getDashboardSummary(),
  });

  if (isLoading || loadingSummary) return <PageSpinner />;

  const totals = summary?.data?.data;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const greeting = greetingForHour(new Date().getHours());
  const rows: CampaignListItemData[] = campaigns?.data.data || [];
  const liveCount = totals?.activeCampaigns || 0;
  const stats = [
    {
      label: 'Campaigns',
      value: formatNumber(totals?.totalCampaigns || 0),
      hint: 'In this workspace',
      to: '/campaigns',
      testId: 'campaigns',
    },
    {
      label: 'Live',
      value: formatNumber(liveCount),
      hint: liveCount > 0 ? 'Accepting entries' : 'None running',
      to: '/campaigns',
      testId: 'live',
    },
    {
      label: 'Participants',
      value: formatNumber(totals?.totalParticipants || 0),
      hint: 'Unique people',
      to: '/analytics',
      testId: 'participants',
    },
    {
      label: 'Entries',
      value: formatNumber(totals?.totalEntries || 0),
      hint: 'All-time',
      to: '/analytics',
      testId: 'entries',
    },
  ];

  const shortcuts = [
    { to: '/campaigns', label: 'Campaigns', hint: 'Create and manage giveaways' },
    { to: '/analytics', label: 'Analytics', hint: 'See what is converting' },
    { to: '/settings/integrations', label: 'Integrations', hint: 'Email, sheets, and webhooks' },
  ];

  return (
    <div className="space-y-10 max-w-7xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-[2.15rem] text-zinc-50 leading-tight text-balance">
            {greeting}, {firstName}
          </h1>
          <p className="page-desc">{healthCopy(liveCount)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" onPress={() => navigate('/analytics')}>
            Analytics
          </Button>
          <Button onPress={() => navigate('/campaigns/new')}>
            <Plus className="w-4 h-4" />
            New campaign
          </Button>
        </div>
      </header>

      <OnboardingChecklist />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 py-5 border-y border-zinc-800/60">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="dash-stat group"
            data-testid={`dashboard-stat-${stat.testId}`}
          >
            <Stat label={stat.label} value={stat.value} hint={stat.hint} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 min-w-0">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <h2 className="section-title">Recent campaigns</h2>
              <p className="meta mt-1">Latest activity in this workspace</p>
            </div>
            <Link
              to="/campaigns"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View all
            </Link>
          </div>

          {rows.length > 0 ? (
            <div className="flex flex-col gap-1 border-t border-zinc-800/60 pt-1">
              {rows.map((campaign) => (
                <CampaignListItem key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Gift className="w-5 h-5" />}
              title="No campaigns yet"
              description="Create a giveaway, add a prize and an entry action, then publish."
              action={
                <Button onPress={() => navigate('/campaigns/new')}>
                  <Plus className="w-4 h-4" />
                  Create campaign
                </Button>
              }
            />
          )}
        </section>

        <aside>
          <h2 className="section-title">Quick start</h2>
          <p className="meta mt-1 mb-2">Jump back into the work</p>
          <nav className="flex flex-col" aria-label="Quick start">
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="dash-shortcut">
                <span className="min-w-0 flex-1">
                  <span className="dash-shortcut-label">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{item.hint}</span>
                </span>
                <ArrowRight className="dash-shortcut-icon" aria-hidden />
              </Link>
            ))}
            <Link to="/campaigns/new" className="dash-shortcut dash-shortcut--accent mt-0.5">
              <span className="min-w-0 flex-1">
                <span className="dash-shortcut-label text-primary-400">Start a campaign</span>
                <span className="mt-0.5 block text-xs text-zinc-500">Prize, entry action, then publish</span>
              </span>
              <Plus className="dash-shortcut-icon text-primary-400" aria-hidden />
            </Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
