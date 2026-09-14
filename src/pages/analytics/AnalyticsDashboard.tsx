import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Badge, Button, PageSpinner, PageHeader, Stat } from '../../components/ui';
import { campaignApi } from '../../services/api';
import { formatCompactNumber } from '../../utils/formatters';
import { apiErrorMessage } from '../campaigns/detail/constants';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function AnalyticsDashboardPage() {
  const [range, setRange] = useState('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['global-analytics', range],
    queryFn: () => campaignApi.getGlobalAnalytics({ range }),
  });

  const payload = data?.data?.data;
  const totals = payload?.totals;
  const comparison = payload?.comparison || [];

  const downloadRow = async (campaignId: string) => {
    try {
      const response = await campaignApi.exportAnalytics(campaignId, 'campaign', { range });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_${campaignId}_${range}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Export failed'));
    }
  };

  if (isLoading) return <PageSpinner />;
  if (isError) return <Card className="p-8 text-center text-zinc-400">Could not load analytics.</Card>;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Aggregated campaign performance"
        actions={
          <div className="flex gap-1">
            {RANGES.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={range === item.value ? 'primary' : 'ghost'}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Visitors', value: totals?.uniqueVisitors || 0, test: 'unique-visitors' },
          { label: 'Participants', value: totals?.participants || 0, test: 'participants' },
          { label: 'Entries', value: totals?.entries || 0, test: 'entries' },
          { label: 'Conversion', value: `${((totals?.conversion || 0) * 100).toFixed(1)}%`, test: 'conversion' },
          { label: 'Referrals', value: comparison.reduce((sum: number, row: any) => sum + (row.referrals || 0), 0), test: 'referrals' },
        ].map((stat) => (
          <Stat
            key={stat.label}
            label={stat.label}
            value={typeof stat.value === 'number' ? formatCompactNumber(stat.value) : stat.value}
            data-testid={`global-analytics-${stat.test}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {[
          { label: 'Campaigns', value: totals?.totalCampaigns || 0 },
          { label: 'Active', value: totals?.activeCampaigns || 0 },
          { label: 'Views', value: totals?.views || 0 },
          { label: 'Winners', value: totals?.winners || 0 },
        ].map((stat) => (
          <div key={stat.label} data-testid={`global-analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-lg font-semibold mt-0.5 tabular-nums">{formatCompactNumber(stat.value)}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-3">Campaign comparison</h2>
        <div className="overflow-x-auto">
          <table className="ui-table">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="pb-3">Campaign</th>
                <th className="pb-3">Views</th>
                <th className="pb-3">Unique</th>
                <th className="pb-3">Participants</th>
                <th className="pb-3">Conversion</th>
                <th className="pb-3">Entries</th>
                <th className="pb-3">Referrals</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {comparison.map((row: any) => (
                <tr key={row.campaignId}>
                  <td className="py-3">
                    <p className="font-medium">{row.title}</p>
                    <Badge size="sm" variant={row.status === 'ACTIVE' ? 'success' : 'default'}>{row.status}</Badge>
                  </td>
                  <td className="py-3">{row.views}</td>
                  <td className="py-3">{row.uniqueVisitors}</td>
                  <td className="py-3">{row.participants}</td>
                  <td className="py-3">{((row.conversion || 0) * 100).toFixed(1)}%</td>
                  <td className="py-3">{row.entries}</td>
                  <td className="py-3">{row.referrals}</td>
                  <td className="py-3">
                    <Button size="sm" variant="secondary" onClick={() => downloadRow(row.campaignId)}>CSV</Button>
                  </td>
                </tr>
              ))}
              {comparison.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    No campaign analytics yet.{' '}
                    <a href="/campaigns/new" className="text-primary-400">Create a campaign</a>
                    {' '}to start collecting data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
