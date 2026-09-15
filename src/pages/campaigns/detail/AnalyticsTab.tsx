import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Download, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, PageSpinner, Stat } from '../../../components/ui';
import { campaignApi, exportApi } from '../../../services/api';
import { formatNumber } from '../../../utils/formatters';
import { apiErrorMessage } from './constants';
import { cn } from '../../../utils/cn';
import { useChartColors } from '../../../theme/chartColors';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

function RangeToggle({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 gap-0.5"
      role="group"
      aria-label="Date range"
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

export function AnalyticsTab({ campaignId }: { campaignId: string }) {
  const CHART = useChartColors();
  const [range, setRange] = useState('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign-analytics', campaignId, range],
    queryFn: () => campaignApi.getAnalytics(campaignId, { range }),
  });

  const analytics = data?.data?.data;
  const overview = analytics?.overview;
  const series = analytics?.series || [];
  const actions = analytics?.actions || [];
  const referrals = analytics?.referrals;
  const audience = analytics?.audience;
  const funnel = analytics?.funnel || [];

  const download = async (
    type: 'campaign' | 'actions' | 'referrals' | 'participants' | 'entries' | 'winners'
  ) => {
    try {
      const response =
        type === 'participants' || type === 'entries' || type === 'winners'
          ? type === 'participants'
            ? await exportApi.exportParticipants(campaignId)
            : type === 'entries'
              ? await exportApi.exportEntries(campaignId)
              : await exportApi.exportWinners(campaignId)
          : await campaignApi.exportAnalytics(campaignId, type, { range });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Export failed'));
    }
  };

  if (isLoading) return <PageSpinner />;
  if (isError) {
    return (
      <Card className="p-8 text-center border border-zinc-800/80">
        <p className="text-zinc-300 font-medium">Could not load analytics</p>
        <p className="text-sm text-zinc-500 mt-1">Try another range or refresh the page.</p>
      </Card>
    );
  }

  const pct = (value: number) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  const funnelMax = Math.max(1, ...funnel.map((step: any) => Number(step.value || 0)));

  const kpis = [
    { label: 'Views', value: overview?.views || 0 },
    { label: 'Unique visitors', value: overview?.uniqueVisitors || 0 },
    { label: 'Participants', value: overview?.participants || 0 },
    { label: 'Entries', value: overview?.entries || 0 },
    { label: 'Conversion', value: pct(overview?.conversion || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title">Analytics</h3>
          <p className="meta mt-1">Campaign performance for the selected range</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6 py-5 border-y border-zinc-800/60">
        {kpis.map((stat) => (
          <Stat
            key={stat.label}
            label={stat.label}
            value={typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
            data-testid={`analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Conversion is unique participants ÷ unique visitors. Zero visitors returns 0%. First-party
        campaign analytics with 30-minute view deduplication — not enterprise anti-bot measurement.
      </p>

      <Card className="p-6">
        <h3 className="section-title mb-1">Trend</h3>
        <p className="meta mb-4">Daily views, visitors, participants, entries, and referrals</p>
        {series.length === 0 ? (
          <p className="text-sm text-zinc-500 py-12 text-center">No series data in this range.</p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="date" stroke={CHART.axis} fontSize={12} />
                <YAxis stroke={CHART.axis} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART.tooltipBg,
                    border: `1px solid ${CHART.tooltipBorder}`,
                    borderRadius: 12,
                    color: CHART.tooltipFg,
                  }}
                />
                <Line type="monotone" dataKey="views" stroke={CHART.views} strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke={CHART.unique}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="participants"
                  stroke={CHART.participants}
                  strokeWidth={2}
                  dot={false}
                />
                <Line type="monotone" dataKey="entries" stroke={CHART.entries} strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="referrals"
                  stroke={CHART.referrals}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="section-title mb-1">Funnel</h3>
        <p className="meta mb-4">Drop-off across the entry journey</p>
        <div className="space-y-3">
          {funnel.map((step: any) => {
            const width = Math.max(8, Math.round((Number(step.value || 0) / funnelMax) * 100));
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-zinc-400">{step.label}</span>
                  <span className="font-medium tabular-nums text-zinc-100">
                    {formatNumber(step.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500/80"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
          {funnel.length === 0 && <p className="text-sm text-zinc-500">No funnel data yet.</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="section-title mb-4">Actions</h3>
        {actions.length === 0 ? (
          <p className="text-sm text-zinc-500">No actions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Completions</th>
                  <th>Unique</th>
                  <th>Points</th>
                  <th>Rate</th>
                  <th>Verification</th>
                  <th>Invalidated</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action: any) => (
                  <tr key={action.actionId}>
                    <td>
                      <p className="font-medium text-zinc-100">{action.title}</p>
                      <p className="text-xs text-zinc-500">{action.type}</p>
                    </td>
                    <td className="tabular-nums">{action.completions}</td>
                    <td className="tabular-nums">{action.uniqueCompleters}</td>
                    <td className="tabular-nums">{formatNumber(action.points)}</td>
                    <td className="tabular-nums text-primary-300">{pct(action.completionRate)}</td>
                    <td className="text-zinc-400">{action.verificationMode}</td>
                    <td className="tabular-nums">{action.invalidated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="section-title mb-1">Referrals</h3>
        <p className="meta mb-4">
          Viral coefficient = successful referrals ÷ total participants. Marketing source is tracked
          separately from referral codes.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Successful', value: referrals?.successfulReferrals || 0 },
            { label: 'Who referred', value: referrals?.participantsWhoReferred || 0 },
            {
              label: 'Referral points',
              value: formatNumber(referrals?.referralGeneratedPoints || 0),
            },
            {
              label: 'Viral coefficient',
              value: Number(referrals?.viralCoefficient || 0).toFixed(2),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3"
            >
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">{item.label}</p>
              <p className="text-lg font-semibold tabular-nums mt-1 text-zinc-50">{item.value}</p>
            </div>
          ))}
        </div>
        {(referrals?.topReferrers || []).length === 0 ? (
          <p className="text-sm text-zinc-500">No referral data yet.</p>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Referrals</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {referrals.topReferrers.map((row: any) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-medium text-zinc-100">{row.name || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-500">{row.email}</p>
                  </td>
                  <td className="tabular-nums">{row.referrals}</td>
                  <td className="tabular-nums text-primary-400">{formatNumber(row.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-zinc-500 mt-3">
          Risk-flagged referrals: {referrals?.riskFlaggedReferrals || 0}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-400" /> Audience
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Device</p>
              {(audience?.devices || []).map((row: any) => (
                <p key={row.device} className="text-sm text-zinc-300">
                  {row.device}: {row.count}
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Browser</p>
              {(audience?.browsers || []).map((row: any) => (
                <p key={row.browser} className="text-sm text-zinc-300">
                  {row.browser}: {row.count}
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Source</p>
              {(audience?.sources || []).map((row: any) => (
                <p key={row.source} className="text-sm text-zinc-300">
                  {row.source}: {row.count}
                </p>
              ))}
            </div>
          </div>
          {(audience?.countries || []).length === 0 ? (
            <p className="text-sm text-zinc-500">No geographic data yet.</p>
          ) : (
            <div className="space-y-1">
              {audience.countries.slice(0, 10).map((country: any) => (
                <div key={country.country} className="flex justify-between text-sm">
                  <span className="text-zinc-200">{country.country}</span>
                  <span className="text-zinc-500">
                    {country.participants} p · {country.views} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-primary-400" /> Export
          </h3>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('campaign')}>
              Campaign performance
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('actions')}>
              Action performance
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('referrals')}>
              Referral performance
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => download('participants')}
            >
              Participants (CSV)
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('entries')}>
              Entries (CSV)
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('winners')}>
              Winners (CSV)
            </Button>
          </div>
        </Card>
      </div>

      {(audience?.devices || []).length > 0 && (
        <Card className="p-6">
          <h3 className="section-title mb-1">Device mix</h3>
          <p className="meta mb-4">Share of traffic by device type</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={audience.devices}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="device" stroke={CHART.axis} fontSize={12} />
                <YAxis stroke={CHART.axis} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART.tooltipBg,
                    border: `1px solid ${CHART.tooltipBorder}`,
                    borderRadius: 12,
                    color: CHART.tooltipFg,
                  }}
                />
                <Bar dataKey="count" fill={CHART.bar} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
