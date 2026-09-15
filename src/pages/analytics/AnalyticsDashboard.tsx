import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Download,
  Eye,
  Gift,
  Percent,
  Radio,
  Share2,
  Trophy,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/ui';
import { campaignApi } from '../../services/api';
import { formatCompactNumber } from '../../utils/formatters';
import { apiErrorMessage } from '../campaigns/detail/constants';
import { cn } from '../../utils/cn';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

function RangeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-primary-500/25 bg-zinc-900 p-1 gap-0.5"
      role="group"
      aria-label="Analytics date range"
    >
      {RANGES.map((item) => {
        const active = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200',
              active
                ? 'bg-primary-500/20 text-primary-200 border border-primary-500/35'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl">
      <div className="dash-hero p-6 md:p-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56 mt-3" />
        <Skeleton className="h-4 w-80 mt-3 max-w-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dash-stat p-5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3 w-16 mt-4" />
            <Skeleton className="h-7 w-20 mt-2" />
          </div>
        ))}
      </div>
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}

export function AnalyticsDashboardPage() {
  const [range, setRange] = useState('30d');
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['global-analytics', range],
    queryFn: () => campaignApi.getGlobalAnalytics({ range }),
  });

  const fadeUp = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
      };

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };

  const downloadRow = async (campaignId: string, title?: string) => {
    try {
      const response = await campaignApi.exportAnalytics(campaignId, 'campaign', { range });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(title || 'campaign').replace(/\s+/g, '_').toLowerCase()}_${range}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Export failed'));
    }
  };

  if (isLoading) return <AnalyticsSkeleton />;

  if (isError) {
    return (
      <div className="max-w-7xl flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="h-7 w-7" aria-hidden />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Analytics</p>
          <h1 className="mt-2 text-2xl font-display font-semibold text-zinc-50">Couldn’t load analytics</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Workspace analytics failed to load. Check your connection, then retry.
          </p>
          <Button className="mt-7" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const payload = data?.data?.data;
  const totals = payload?.totals;
  const comparison = payload?.comparison || [];
  const referralTotal = comparison.reduce((sum: number, row: any) => sum + (row.referrals || 0), 0);
  const conversionPct = `${((totals?.conversion || 0) * 100).toFixed(1)}%`;

  const primaryStats = [
    {
      label: 'Visitors',
      value: formatCompactNumber(totals?.uniqueVisitors || 0),
      hint: 'Unique in range',
      icon: Eye,
      test: 'unique-visitors',
    },
    {
      label: 'Participants',
      value: formatCompactNumber(totals?.participants || 0),
      hint: 'People who entered',
      icon: Users,
      test: 'participants',
    },
    {
      label: 'Entries',
      value: formatCompactNumber(totals?.entries || 0),
      hint: 'All entry actions',
      icon: Trophy,
      test: 'entries',
    },
    {
      label: 'Conversion',
      value: conversionPct,
      hint: 'Participants ÷ visitors',
      icon: Percent,
      test: 'conversion',
    },
    {
      label: 'Referrals',
      value: formatCompactNumber(referralTotal),
      hint: 'Across campaigns',
      icon: Share2,
      test: 'referrals',
    },
  ];

  const secondaryStats = [
    { label: 'Campaigns', value: totals?.totalCampaigns || 0, icon: Gift },
    { label: 'Active', value: totals?.activeCampaigns || 0, icon: Radio },
    { label: 'Views', value: totals?.views || 0, icon: Eye },
    { label: 'Winners', value: totals?.winners || 0, icon: Trophy },
  ];

  return (
    <motion.div className="space-y-8 max-w-7xl" initial="hidden" animate="show" variants={stagger}>
      <motion.header variants={fadeUp} className="dash-hero p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-400">
              Performance
            </p>
            <h1 className="font-display text-3xl md:text-[2.35rem] text-zinc-50 mt-2 leading-tight text-balance">
              Analytics
            </h1>
            <p className="page-desc mt-2">
              Aggregated campaign performance for this workspace. First-party metrics with view deduplication —
              not enterprise anti-bot measurement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <RangeToggle value={range} onChange={setRange} />
            <Button variant="secondary" onPress={() => navigate('/campaigns')}>
              <Gift className="w-4 h-4" />
              Campaigns
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {primaryStats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="dash-stat block p-5"
            data-testid={`global-analytics-${stat.test}`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-300 border border-primary-500/20">
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mt-4">{stat.label}</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1 text-zinc-50">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.hint}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900 px-4 py-3"
            data-testid={`global-analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center gap-2 text-zinc-500">
              <stat.icon className="w-3.5 h-3.5 text-primary-400/80" />
              <p className="text-[11px] font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums mt-1.5 text-zinc-50">
              {formatCompactNumber(stat.value)}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.section variants={fadeUp}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="section-title">Campaign comparison</h2>
            <p className="meta mt-1">Side-by-side performance for the selected range</p>
          </div>
          <Link
            to="/campaigns"
            className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition-colors shrink-0"
          >
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {comparison.length === 0 ? (
          <Card className="border border-zinc-800/80">
            <EmptyState
              icon={<BarChart3 className="w-5 h-5" />}
              title="No campaign analytics yet"
              description="Publish a campaign and collect entries to see comparison metrics here."
              action={
                <Button onPress={() => navigate('/campaigns/new')}>
                  <Gift className="w-4 h-4" />
                  Create a campaign
                </Button>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Views</th>
                    <th>Unique</th>
                    <th>Participants</th>
                    <th>Conversion</th>
                    <th>Entries</th>
                    <th>Referrals</th>
                    <th className="text-right">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row: any) => (
                    <tr key={row.campaignId} className="hover:bg-zinc-900/40 transition-colors">
                      <td>
                        <Link
                          to={`/campaigns/${row.campaignId}`}
                          className="group inline-flex flex-col gap-1.5 min-w-0"
                        >
                          <span className="font-medium text-zinc-50 group-hover:text-primary-200 transition-colors truncate max-w-[14rem]">
                            {row.title}
                          </span>
                          <Badge size="sm" variant={row.status === 'ACTIVE' ? 'success' : 'default'}>
                            {row.status}
                          </Badge>
                        </Link>
                      </td>
                      <td className="tabular-nums text-zinc-300">{formatCompactNumber(row.views || 0)}</td>
                      <td className="tabular-nums text-zinc-300">{formatCompactNumber(row.uniqueVisitors || 0)}</td>
                      <td className="tabular-nums text-zinc-300">{formatCompactNumber(row.participants || 0)}</td>
                      <td className="tabular-nums text-primary-300">
                        {((row.conversion || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="tabular-nums text-zinc-300">{formatCompactNumber(row.entries || 0)}</td>
                      <td className="tabular-nums text-zinc-300">{formatCompactNumber(row.referrals || 0)}</td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadRow(row.campaignId, row.title)}
                          aria-label={`Download CSV for ${row.title}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.section>
    </motion.div>
  );
}
