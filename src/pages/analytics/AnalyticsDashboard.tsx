import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Download,
  Gift,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, PageHeader, Skeleton, Stat } from '../../components/ui';
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

const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-emerald-400',
  DRAFT: 'bg-zinc-500',
  SCHEDULED: 'bg-sky-400',
  PAUSED: 'bg-amber-400',
  ENDED: 'bg-red-400',
};

function CampaignStatusMark({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-zinc-500">
      <span
        className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status] || 'bg-zinc-500')}
        aria-hidden
      />
      {status}
    </span>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 gap-0.5"
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
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              active
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-200'
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
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 mt-3 max-w-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6 py-5 border-y border-zinc-800/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-20 mt-2" />
            <Skeleton className="h-3 w-24 mt-2" />
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
      test: 'unique-visitors',
    },
    {
      label: 'Participants',
      value: formatCompactNumber(totals?.participants || 0),
      hint: 'People who entered',
      test: 'participants',
    },
    {
      label: 'Entries',
      value: formatCompactNumber(totals?.entries || 0),
      hint: 'All entry actions',
      test: 'entries',
    },
    {
      label: 'Conversion',
      value: conversionPct,
      hint: 'Participants ÷ visitors',
      test: 'conversion',
    },
    {
      label: 'Referrals',
      value: formatCompactNumber(referralTotal),
      hint: 'Across campaigns',
      test: 'referrals',
    },
  ];

  const secondaryStats = [
    { label: 'Campaigns', value: totals?.totalCampaigns || 0 },
    { label: 'Active', value: totals?.activeCampaigns || 0 },
    { label: 'Views', value: totals?.views || 0 },
    { label: 'Winners', value: totals?.winners || 0 },
  ];

  return (
    <motion.div className="space-y-8 max-w-7xl" initial="hidden" animate="show" variants={stagger}>
      <PageHeader
        title="Analytics"
        description="Workspace performance for the selected range. First-party metrics with view deduplication — not enterprise anti-bot measurement."
        actions={
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <RangeToggle value={range} onChange={setRange} />
            <Button variant="secondary" onPress={() => navigate('/campaigns')}>
              Campaigns
            </Button>
          </div>
        }
      />

      <div className="border-y border-zinc-800/60">
        <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6 py-5">
          {primaryStats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              data-testid={`global-analytics-${stat.test}`}
            >
              <Stat label={stat.label} value={stat.value} hint={stat.hint} />
            </motion.div>
          ))}
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-6 py-5 border-t border-zinc-800/60">
          {secondaryStats.map((stat) => (
            <div
              key={stat.label}
              data-testid={`global-analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <p className="text-sm text-zinc-500">{stat.label}</p>
              <p className="text-lg font-semibold tabular-nums mt-1 text-zinc-50">
                {formatCompactNumber(stat.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="ui-table ui-table--page min-w-[52rem]">
              <colgroup>
                <col className="w-[28%]" />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col className="w-24" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="pr-8">Campaign</th>
                  <th scope="col" className="text-right whitespace-nowrap">Views</th>
                  <th scope="col" className="text-right whitespace-nowrap">Unique</th>
                  <th scope="col" className="text-right whitespace-nowrap">Participants</th>
                  <th scope="col" className="text-right whitespace-nowrap">Conversion</th>
                  <th scope="col" className="text-right whitespace-nowrap">Entries</th>
                  <th scope="col" className="text-right whitespace-nowrap">Referrals</th>
                  <th scope="col" className="text-right whitespace-nowrap">Export</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row: any) => (
                  <tr key={row.campaignId}>
                    <td className="pr-8">
                      <Link
                        to={`/campaigns/${row.campaignId}`}
                        className="group inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-md outline-none"
                      >
                        <span className="truncate text-sm font-medium text-zinc-50 transition-colors group-hover:text-primary-300 pl-1">
                          {row.title}
                        </span>
                        <CampaignStatusMark status={row.status} />
                      </Link>
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-400">
                      {formatCompactNumber(row.views || 0)}
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-400">
                      {formatCompactNumber(row.uniqueVisitors || 0)}
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-400">
                      {formatCompactNumber(row.participants || 0)}
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-300">
                      {((row.conversion || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-400">
                      {formatCompactNumber(row.entries || 0)}
                    </td>
                    <td className="tabular-nums whitespace-nowrap text-start text-zinc-400">
                      {formatCompactNumber(row.referrals || 0)}
                    </td>
                    <td className="text-start">
                      <button
                        type="button"
                        className="ui-table-export inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-200"
                        onClick={() => downloadRow(row.campaignId, row.title)}
                        aria-label={`Download CSV for ${row.title}`}
                      >
                        <Download className="ui-table-export-icon" aria-hidden />
                        CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
