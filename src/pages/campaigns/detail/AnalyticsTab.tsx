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

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function AnalyticsTab({ campaignId }: { campaignId: string }) {
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

  const download = async (type: 'campaign' | 'actions' | 'referrals' | 'participants' | 'entries' | 'winners') => {
    try {
      const response = type === 'participants' || type === 'entries' || type === 'winners'
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
  if (isError) return <Card className="p-8 text-center text-zinc-400">Could not load analytics.</Card>;

  const pct = (value: number) => `${(Number(value || 0) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Analytics</h3>
        <div className="flex gap-1">
          {RANGES.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={range === item.value ? 'primary' : 'secondary'}
              onClick={() => setRange(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: 'Views', value: overview?.views || 0 },
          { label: 'Unique visitors', value: overview?.uniqueVisitors || 0 },
          { label: 'Participants', value: overview?.participants || 0 },
          { label: 'Entries', value: overview?.entries || 0 },
          { label: 'Conversion', value: pct(overview?.conversion || 0) },
        ].map((stat) => (
          <Stat
            key={stat.label}
            label={stat.label}
            value={typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
            data-testid={`analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Conversion is unique participants ÷ unique visitors. Zero visitors returns 0%.
        First-party campaign analytics with 30-minute view deduplication — not enterprise anti-bot measurement.
      </p>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trend</h3>
        {series.length === 0 ? (
          <p className="text-sm text-zinc-500 py-12 text-center">No series data in this range.</p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                <Line type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="uniqueVisitors" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="participants" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="entries" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="referrals" stroke="#a1a1aa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Funnel</h3>
        <div className="space-y-2">
          {funnel.map((step: any) => (
            <div key={step.key} className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{step.label}</span>
              <span className="font-medium">{formatNumber(step.value)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        {actions.length === 0 ? (
          <p className="text-sm text-zinc-500">No actions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Completions</th>
                  <th className="pb-2">Unique</th>
                  <th className="pb-2">Points</th>
                  <th className="pb-2">Rate</th>
                  <th className="pb-2">Verification</th>
                  <th className="pb-2">Invalidated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {actions.map((action: any) => (
                  <tr key={action.actionId}>
                    <td className="py-2">
                      <p>{action.title}</p>
                      <p className="text-xs text-zinc-500">{action.type}</p>
                    </td>
                    <td className="py-2">{action.completions}</td>
                    <td className="py-2">{action.uniqueCompleters}</td>
                    <td className="py-2">{formatNumber(action.points)}</td>
                    <td className="py-2">{pct(action.completionRate)}</td>
                    <td className="py-2 text-zinc-400">{action.verificationMode}</td>
                    <td className="py-2">{action.invalidated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Referrals</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Viral coefficient = successful referrals ÷ total participants (average new participants generated per participant).
          Marketing traffic source is tracked separately from participant referral codes.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div><p className="text-zinc-400">Successful</p><p className="text-lg font-semibold">{referrals?.successfulReferrals || 0}</p></div>
          <div><p className="text-zinc-400">Who referred</p><p className="text-lg font-semibold">{referrals?.participantsWhoReferred || 0}</p></div>
          <div><p className="text-zinc-400">Referral points</p><p className="text-lg font-semibold">{formatNumber(referrals?.referralGeneratedPoints || 0)}</p></div>
          <div><p className="text-zinc-400">Viral coefficient</p><p className="text-lg font-semibold">{Number(referrals?.viralCoefficient || 0).toFixed(2)}</p></div>
        </div>
        {(referrals?.topReferrers || []).length === 0 ? (
          <p className="text-sm text-zinc-500">No referral data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="pb-2">Participant</th>
                <th className="pb-2">Referrals</th>
                <th className="pb-2">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {referrals.topReferrers.map((row: any) => (
                <tr key={row.id}>
                  <td className="py-2">
                    <p>{row.name || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-500">{row.email}</p>
                  </td>
                  <td className="py-2">{row.referrals}</td>
                  <td className="py-2 text-primary-400">{formatNumber(row.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-zinc-500 mt-3">Risk-flagged referrals: {referrals?.riskFlaggedReferrals || 0}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Audience</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Device</p>
              {(audience?.devices || []).map((row: any) => (
                <p key={row.device} className="text-sm">{row.device}: {row.count}</p>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Browser</p>
              {(audience?.browsers || []).map((row: any) => (
                <p key={row.browser} className="text-sm">{row.browser}: {row.count}</p>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Source</p>
              {(audience?.sources || []).map((row: any) => (
                <p key={row.source} className="text-sm">{row.source}: {row.count}</p>
              ))}
            </div>
          </div>
          {(audience?.countries || []).length === 0 ? (
            <p className="text-sm text-zinc-500">No geographic data yet.</p>
          ) : (
            <div className="space-y-1">
              {audience.countries.slice(0, 10).map((country: any) => (
                <div key={country.country} className="flex justify-between text-sm">
                  <span>{country.country}</span>
                  <span className="text-zinc-400">{country.participants} p · {country.views} views</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Download className="w-5 h-5" /> Export</h3>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('campaign')}>Campaign performance</Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('actions')}>Action performance</Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('referrals')}>Referral performance</Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('participants')}>Participants (CSV)</Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('entries')}>Entries (CSV)</Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => download('winners')}>Winners (CSV)</Button>
          </div>
        </Card>
      </div>

      {(audience?.devices || []).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device mix</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={audience.devices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="device" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
