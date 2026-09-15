import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Gift,
  Users,
  Plus,
  ArrowRight,
  BarChart3,
  Plug,
  Trophy,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Button, Card, EmptyState, PageSpinner } from '../../components/ui';
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

const easeOut = [0.22, 1, 0.36, 1] as const;

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', 'recent'],
    queryFn: () => campaignApi.getAll({ limit: 5 }),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => campaignApi.getDashboardSummary(),
  });

  const totals = summary?.data?.data;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const greeting = greetingForHour(new Date().getHours());

  const fadeUp = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
      };

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.07,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  if (isLoading || loadingSummary) return <PageSpinner />;

  const rows: CampaignListItemData[] = campaigns?.data.data || [];
  const liveCount = totals?.activeCampaigns || 0;
  const stats = [
    {
      label: 'Campaigns',
      value: formatNumber(totals?.totalCampaigns || 0),
      hint: 'In this workspace',
      to: '/campaigns',
      icon: Gift,
    },
    {
      label: 'Live',
      value: formatNumber(liveCount),
      hint: liveCount > 0 ? 'Accepting entries' : 'None running',
      to: '/campaigns',
      icon: Radio,
      live: liveCount > 0,
    },
    {
      label: 'Participants',
      value: formatNumber(totals?.totalParticipants || 0),
      hint: 'Unique people',
      to: '/analytics',
      icon: Users,
    },
    {
      label: 'Entries',
      value: formatNumber(totals?.totalEntries || 0),
      hint: 'All-time',
      to: '/analytics',
      icon: Trophy,
    },
  ];

  const shortcuts = [
    { to: '/campaigns', label: 'Campaigns', hint: 'Create and manage giveaways', icon: Gift },
    { to: '/analytics', label: 'Analytics', hint: 'See what is converting', icon: BarChart3 },
    { to: '/settings/integrations', label: 'Integrations', hint: 'Email, sheets, and webhooks', icon: Plug },
  ];

  return (
    <motion.div className="space-y-8 max-w-7xl" initial="hidden" animate="show" variants={stagger}>
      <motion.header variants={fadeUp} className="dash-hero p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-400">
              Overview
            </p>
            <h1 className="font-display text-3xl md:text-[2.35rem] text-zinc-50 mt-2 leading-tight text-balance">
              {greeting}, {firstName}
            </h1>
            <p className="page-desc mt-2">{healthCopy(liveCount)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="secondary" onPress={() => navigate('/analytics')}>
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button onPress={() => navigate('/campaigns/new')}>
              <Plus className="w-4 h-4" />
              New campaign
            </Button>
          </div>
        </div>
      </motion.header>

      <OnboardingChecklist />

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Link
              to={stat.to}
              className="dash-stat block p-5 group "
              data-testid={`dashboard-stat-${stat.label.toLowerCase()}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-300 border border-primary-500/20">
                  <stat.icon className="w-4 h-4" />
                </div>
                {stat.live ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <span className="dash-pulse relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4 text-zinc-600 transition-all duration-300 group-hover:text-primary-400 group-hover:translate-x-0.5" />
                )}
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mt-4">{stat.label}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1 text-zinc-50">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.hint}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Recent campaigns</h2>
              <p className="meta mt-1">Latest activity across this workspace</p>
            </div>
            <Link
              to="/campaigns"
              className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {rows.length > 0 ? (
            <Card padding="none" className="overflow-hidden">
              <ul className="divide-y divide-zinc-800/70">
                {rows.map((campaign) => (
                  <li key={campaign.id}>
                    <CampaignListItem campaign={campaign} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card padding="none">
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
            </Card>
          )}
        </section>

        <aside className="space-y-4">
          <div>
            <h2 className="section-title">Quick start</h2>
            <p className="meta mt-1">Jump back into the work</p>
          </div>
          <div className="space-y-3">
            {shortcuts.map((item) => (
              <Link key={item.to} to={item.to} className="dash-shortcut group">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-300 border border-primary-500/20">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100 transition-colors duration-300 group-hover:text-primary-400">
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.hint}</p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 text-zinc-600 transition-all duration-300 group-hover:text-primary-400 group-hover:translate-x-0.5" />
              </Link>
            ))}
            <Link
              to="/campaigns/new"
              className="dash-shortcut group border-primary-500/35 bg-primary-500/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-on-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-400">Start a campaign</p>
                <p className="text-xs text-zinc-500 mt-0.5">Prize, entry action, then publish</p>
              </div>
              <Plus className="w-4 h-4 shrink-0 text-primary-400" />
            </Link>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}

