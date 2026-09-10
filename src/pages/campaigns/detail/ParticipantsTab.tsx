import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, Button, Input, Badge, Modal, PageSpinner, EmptyState } from '../../../components/ui';
import { entryApi } from '../../../services/api';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { verificationLabel } from './constants';

export function ParticipantsTab({ campaignId }: { campaignId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign-participants', campaignId, page, appliedSearch],
    queryFn: () => entryApi.getCampaignParticipants(campaignId, { page, limit: 20, search: appliedSearch || undefined }),
  });

  const { data: entriesData, isLoading: loadingEntries } = useQuery({
    queryKey: ['participant-entries', campaignId, selected?.id],
    queryFn: () => entryApi.getParticipantEntries(campaignId, selected.id),
    enabled: !!selected?.id,
  });

  const { data: detailData } = useQuery({
    queryKey: ['participant-detail', campaignId, selected?.id],
    queryFn: () => entryApi.getParticipantDetail(campaignId, selected.id),
    enabled: !!selected?.id,
  });

  const rows = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setAppliedSearch(search.trim());
        }}
      >
        <div className="flex-1">
          <Input
            placeholder="Search name or email"
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <PageSpinner />}
      {isError && <Card className="p-8 text-center text-zinc-400">Could not load participants.</Card>}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          title="No participants yet"
          description="Share the public giveaway page. New signups will appear here."
        />
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="ui-table">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Entries</th>
                  <th className="p-4">Referral</th>
                  <th className="p-4">Referred by</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((row: any) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-800/40 cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <td className="p-4">{row.name || '—'}</td>
                    <td className="p-4">{row.email}</td>
                    <td className="p-4 text-primary-400 font-medium">{formatNumber(row.totalPoints)}</td>
                    <td className="p-4">{row._count?.entries ?? 0}</td>
                    <td className="p-4 font-mono">{row.referralCode}</td>
                    <td className="p-4">{row.referredBy || '—'}</td>
                    <td className="p-4">{row.country || '—'}</td>
                    <td className="p-4 text-zinc-400">{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between p-4 text-sm text-zinc-400">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={!pagination.hasMore} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Participant details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-zinc-400">Name:</span> {selected.name || '—'}</p>
              <p><span className="text-zinc-400">Email:</span> {selected.email}</p>
              <p><span className="text-zinc-400">Points:</span> {selected.totalPoints}</p>
              <p><span className="text-zinc-400">Referral code:</span> {selected.referralCode}</p>
              <p><span className="text-zinc-400">Referred by:</span> {selected.referredBy || '—'}</p>
              <p><span className="text-zinc-400">Country:</span> {selected.country || '—'}</p>
            </div>
            {detailData?.data?.data && (
              <div className="space-y-3 text-sm">
                <h4 className="font-medium">Custom form answers</h4>
                <pre className="text-xs bg-zinc-800/60 p-3 rounded-lg overflow-x-auto">{JSON.stringify(detailData.data.data.customFields || {}, null, 2)}</pre>
                <h4 className="font-medium">Consent</h4>
                {(detailData.data.data.consents || []).length === 0 && <p className="text-zinc-500">No stored consent.</p>}
                {(detailData.data.data.consents || []).map((consent: any) => (
                  <p key={consent.id}>
                    {consent.acceptedAt} · terms {consent.termsAccepted ? 'yes' : 'no'} · privacy {consent.privacyAccepted ? 'yes' : 'no'} · rules {consent.rulesAccepted ? 'yes' : 'no'}
                  </p>
                ))}
                <h4 className="font-medium">Referral activity</h4>
                <p>{(detailData.data.data.referrals || []).length} successful referrals</p>
                <h4 className="font-medium">Uploads</h4>
                {(detailData.data.data.files || []).length === 0 && <p className="text-zinc-500">No uploads.</p>}
                {(detailData.data.data.files || []).map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between gap-2">
                    <span>{file.originalName} ({file.kind})</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      data-testid="participant-file-download"
                      onClick={async () => {
                        const res = await entryApi.downloadFile(campaignId, file.id);
                        const url = URL.createObjectURL(res.data);
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <h4 className="font-medium">Entries</h4>
            {loadingEntries && <p className="text-sm text-zinc-500">Loading entries…</p>}
            {(entriesData?.data?.data || []).length === 0 && !loadingEntries && (
              <p className="text-sm text-zinc-500">No entries for this participant.</p>
            )}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(entriesData?.data?.data || []).map((entry: any) => (
                <div key={entry.id} className="p-3 rounded-lg bg-zinc-800/60 flex items-center justify-between">
                  <div>
                    <p>{entry.action?.title}</p>
                    <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                    {entry.metadata?.response != null && (
                      <p className="text-xs text-zinc-400 mt-1">Answer: {typeof entry.metadata.response === 'string' ? entry.metadata.response : JSON.stringify(entry.metadata.response)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant={entry.invalidated ? 'danger' : entry.verified ? 'success' : 'warning'}>
                      {verificationLabel(entry)}
                    </Badge>
                    <span className="text-sm">+{entry.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
