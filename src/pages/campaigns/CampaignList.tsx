import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Gift,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Pause,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  SearchField,
  FilterSelect,
  PageSpinner,
  Modal,
  PageHeader,
  EmptyState,
  MenuTrigger,
  Menu,
  MenuItem,
  MenuSeparator,
} from '../../components/ui';
import type { FilterSelectOption } from '../../components/ui';
import { CampaignListItem } from '../../components/campaigns/CampaignListItem';
import { billingApi, campaignApi, planLimitMessage } from '../../services/api';

const statusOptions: FilterSelectOption[] = [
  { value: '', label: 'All statuses', hint: 'Show every campaign', dotClassName: 'bg-primary-400' },
  { value: 'DRAFT', label: 'Draft', hint: 'Not published yet', dotClassName: 'bg-zinc-400' },
  { value: 'ACTIVE', label: 'Active', hint: 'Live and accepting entries', dotClassName: 'bg-emerald-400' },
  { value: 'PAUSED', label: 'Paused', hint: 'Temporarily stopped', dotClassName: 'bg-amber-400' },
  { value: 'ENDED', label: 'Ended', hint: 'Campaign finished', dotClassName: 'bg-red-400' },
];

function campaignMatchesQuery(campaign: { title?: string; slug?: string }, query: string) {
  if (!query) return true;
  const haystack = `${campaign.title || ''} ${campaign.slug || ''}`.toLowerCase();
  return haystack.includes(query);
}

function CampaignActionsMenu({
  campaign,
  onDuplicate,
  onPause,
  onActivate,
  onDelete,
}: {
  campaign: { id: string; status: string; slug: string };
  onDuplicate: () => void;
  onPause: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const editPath = campaign.status === 'DRAFT' ? `/campaigns/${campaign.id}/edit` : `/campaigns/${campaign.id}`;

  return (
    <MenuTrigger>
      <Button aria-label="Campaign actions" variant="ghost" className="h-8 w-8 px-0" data-testid="campaign-menu">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      <Menu aria-label="Campaign actions">
        <MenuItem textValue={campaign.status === 'DRAFT' ? 'Edit draft' : 'Edit'} onAction={() => navigate(editPath)}>
          <Pencil className="w-4 h-4 text-zinc-400 shrink-0" />
          {campaign.status === 'DRAFT' ? 'Edit draft' : 'Edit'}
        </MenuItem>
        <MenuItem textValue="Open builder" onAction={() => navigate(`/campaigns/${campaign.id}/edit`)}>
          <Pencil className="w-4 h-4 text-zinc-400 shrink-0" />
          Open builder
        </MenuItem>
        <MenuItem textValue="Duplicate" data-testid="campaign-duplicate" onAction={onDuplicate}>
          <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
          Duplicate
        </MenuItem>
        <MenuItem textValue="Public page" href={`/c/${campaign.slug}`} target="_blank" rel="noreferrer">
          <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0" />
          Public page
        </MenuItem>
        <MenuSeparator />
        {campaign.status === 'ACTIVE' ? (
          <MenuItem textValue="Pause" data-testid="campaign-pause" className="text-amber-400" onAction={onPause}>
            <Pause className="w-4 h-4 shrink-0" />
            Pause
          </MenuItem>
        ) : campaign.status !== 'ENDED' ? (
          <MenuItem textValue="Activate" data-testid="campaign-activate" className="text-emerald-400" onAction={onActivate}>
            <Play className="w-4 h-4 shrink-0" />
            Activate
          </MenuItem>
        ) : null}
        <MenuItem textValue="Delete" data-testid="campaign-delete" className="text-red-400" onAction={onDelete}>
          <Trash2 className="w-4 h-4 shrink-0" />
          Delete
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

export function CampaignListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', status],
    queryFn: () => campaignApi.getAll({ status: status || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
      setDeleteModal(null);
    },
    onError: () => toast.error('Failed to delete campaign'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => campaignApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Failed to duplicate campaign'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      campaignApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Status updated');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Failed to update status'),
  });

  const billing = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingApi.summary().then((r) => r.data.data),
    retry: 1,
    staleTime: 15_000,
  });

  const query = search.trim().toLowerCase();
  const pool = data?.data.data;
  const campaigns = useMemo(
    () => (pool || []).filter((campaign: { title?: string; slug?: string }) => campaignMatchesQuery(campaign, query)),
    [pool, query]
  );
  const filtersActive = Boolean(query || status);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Campaigns"
        description="Create, publish, and manage giveaways."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={() => navigate('/templates')}>
              Browse templates
            </Button>
            <Button onPress={() => navigate(billing.data?.needsPlan ? '/choose-plan' : '/campaigns/new')}>
              <Plus className="w-4 h-4" />
              {billing.data?.needsPlan ? 'Start 7-day trial' : 'New campaign'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchField
          className="flex-1"
          aria-label="Search campaigns"
          placeholder="Search campaigns..."
          value={search}
          onChange={setSearch}
          data-testid="campaign-search"
        />
        <FilterSelect
          className="md:w-52"
          options={statusOptions}
          value={status}
          onChange={setStatus}
          aria-label="Filter by status"
          data-testid="campaign-status-filter"
        />
      </div>

      {campaigns.length > 0 ? (
        <div className="flex flex-col gap-1 border-t border-zinc-800/60 pt-1">
          {campaigns.map((campaign: any) => (
            <CampaignListItem
              key={campaign.id}
              data-testid="campaign-card"
              campaign={campaign}
              actions={
                <CampaignActionsMenu
                  campaign={campaign}
                  onDuplicate={() => duplicateMutation.mutate(campaign.id)}
                  onPause={() => statusMutation.mutate({ id: campaign.id, status: 'PAUSED' })}
                  onActivate={() => statusMutation.mutate({ id: campaign.id, status: 'ACTIVE' })}
                  onDelete={() => setDeleteModal(campaign.id)}
                />
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          data-testid="campaigns-empty"
          icon={<Gift className="w-5 h-5" />}
          title={filtersActive ? 'No campaigns match' : 'No campaigns found'}
          description={filtersActive ? 'Clear search or status to see the rest of the list.' : 'Create a giveaway from scratch or a template. You can save a draft before publishing.'}
          action={!filtersActive ? (
            <Button onPress={() => navigate(billing.data?.needsPlan ? '/choose-plan' : '/campaigns/new')}>
              <Plus className="w-4 h-4" />
              {billing.data?.needsPlan ? 'Start 7-day trial' : 'Create campaign'}
            </Button>
          ) : undefined}
        />
      )}

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete campaign"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button
              variant="danger"
              data-testid="campaign-delete-confirm"
              onClick={() => deleteModal && deleteMutation.mutate(deleteModal)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-400">
          Are you sure you want to delete this campaign? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
