import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Gift,
  Users,
  Trophy,
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
  Badge,
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
import { billingApi, campaignApi, planLimitMessage } from '../../services/api';
import { formatNumber, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  SCHEDULED: 'info',
  PAUSED: 'warning',
  ENDED: 'danger',
};

const statusOptions: FilterSelectOption[] = [
  { value: '', label: 'All Statuses', hint: 'Show every campaign', dotClassName: 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]' },
  { value: 'DRAFT', label: 'Draft', hint: 'Not published yet', dotClassName: 'bg-zinc-400' },
  { value: 'ACTIVE', label: 'Active', hint: 'Live and accepting entries', dotClassName: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]' },
  { value: 'PAUSED', label: 'Paused', hint: 'Temporarily stopped', dotClassName: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]' },
  { value: 'ENDED', label: 'Ended', hint: 'Campaign finished', dotClassName: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]' },
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
      <Button aria-label="Campaign actions" variant="secondary" className="h-10 w-10 px-0" data-testid="campaign-menu">
        <MoreHorizontal className="w-5 h-5" />
      </Button>
      <Menu aria-label="Campaign actions">
        <MenuItem textValue={campaign.status === 'DRAFT' ? 'Edit draft' : 'Edit'} onAction={() => navigate(editPath)}>
          <Pencil className="w-4 h-4 text-primary-400 shrink-0" />
          {campaign.status === 'DRAFT' ? 'Edit draft' : 'Edit'}
        </MenuItem>
        <MenuItem textValue="Open builder" onAction={() => navigate(`/campaigns/${campaign.id}/edit`)}>
          <Pencil className="w-4 h-4 text-primary-400 shrink-0" />
          Open builder
        </MenuItem>
        <MenuItem textValue="Duplicate" data-testid="campaign-duplicate" onAction={onDuplicate}>
          <Copy className="w-4 h-4 text-primary-400 shrink-0" />
          Duplicate
        </MenuItem>
        <MenuItem textValue="Public page" href={`/c/${campaign.slug}`} target="_blank" rel="noreferrer">
          <ExternalLink className="w-4 h-4 text-primary-400 shrink-0" />
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
  const reduceMotion = useReducedMotion();
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
        <div className="divide-y divide-zinc-800/70 border-t border-zinc-800/70">
          <AnimatePresence initial={false}>
            {campaigns.map((campaign: any, index: number) => (
            <motion.div
              key={campaign.id}
              data-testid="campaign-card"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{
                duration: reduceMotion ? 0.12 : 0.22,
                delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.16),
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn('campaign-row flex items-start gap-4 py-2 -mx-2 px-3')}
            >
              <Link to={`/campaigns/${campaign.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-zinc-50" data-testid="campaign-title">{campaign.title}</h3>
                  <Badge variant={statusColors[campaign.status]} size="sm">{campaign.status}</Badge>
                  {campaign.status === 'ACTIVE' && (
                    <span className="dash-pulse hidden sm:inline-block h-1.5 w-1.3 rounded-full bg-emerald-400" />
                  )}
                </div>
                {campaign.description && (
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{campaign.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatNumber(campaign._count.participants)}</span>
                  <span className="inline-flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{formatNumber(campaign._count.entries)}</span>
                  {campaign.startDate && (
                    <span>{formatDate(campaign.startDate)} – {campaign.endDate ? formatDate(campaign.endDate) : 'Open'}</span>
                  )}
                </div>
              </Link>
              <div className="relative shrink-0">
                <CampaignActionsMenu
                  campaign={campaign}
                  onDuplicate={() => duplicateMutation.mutate(campaign.id)}
                  onPause={() => statusMutation.mutate({ id: campaign.id, status: 'PAUSED' })}
                  onActivate={() => statusMutation.mutate({ id: campaign.id, status: 'ACTIVE' })}
                  onDelete={() => setDeleteModal(campaign.id)}
                />
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
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
