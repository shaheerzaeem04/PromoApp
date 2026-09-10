import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Gift,
  Users,
  Trophy,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Pause,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Input, FilterSelect, PageSpinner, Modal, PageHeader, EmptyState } from '../../components/ui';
import type { FilterSelectOption } from '../../components/ui';
import { billingApi, campaignApi, planLimitMessage } from '../../services/api';
import { formatNumber, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const menuItemClass =
  'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-left transition-colors text-zinc-300 hover:bg-primary-500/15 hover:text-zinc-50';

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

export function CampaignListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

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

  const campaigns = data?.data.data?.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Campaigns"
        description="Create, publish, and manage giveaways."
        actions={
          <Link to={billing.data?.needsPlan ? '/choose-plan' : '/campaigns/new'}>
            <Button>
              <Plus className="w-4 h-4" />
              {billing.data?.needsPlan ? 'Start 7-day trial' : 'New campaign'}
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            data-testid="campaign-search"
          />
        </div>
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
          {campaigns.map((campaign: any) => (
            <div
              key={campaign.id}
              data-testid="campaign-card"
              className={`flex items-start gap-4 py-4 relative ${menuOpen === campaign.id ? 'z-20' : ''}`}
            >
              <Link to={`/campaigns/${campaign.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-zinc-50" data-testid="campaign-title">{campaign.title}</h3>
                  <Badge variant={statusColors[campaign.status]} size="sm">{campaign.status}</Badge>
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
              <div
                ref={menuOpen === campaign.id ? menuRef : undefined}
                className={cn('relative shrink-0', menuOpen === campaign.id && 'z-20')}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen(menuOpen === campaign.id ? null : campaign.id)}
                  className={cn(
                    'inline-flex items-center justify-center h-10 w-10 rounded-xl border box-border transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-0',
                    menuOpen === campaign.id
                      ? 'text-zinc-50 border-primary-500/70 bg-zinc-900/70 ring-2 ring-primary-500/25'
                      : 'text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-800/80 hover:border-primary-500/25'
                  )}
                  data-testid="campaign-menu"
                  aria-label="Campaign actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen === campaign.id}
                >
                  <MoreVertical className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                </button>
                {menuOpen === campaign.id && (
                  <div
                    role="menu"
                    className={cn(
                      'absolute right-0 top-full mt-2 w-52 overflow-hidden z-50',
                      'rounded-xl border border-primary-500/35',
                      'bg-zinc-950/80 backdrop-blur-xl',
                      'shadow-2xl shadow-primary-500/10 ring-1 ring-primary-500/15'
                    )}
                  >
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        role="menuitem"
                        to={campaign.status === 'DRAFT' ? `/campaigns/${campaign.id}/edit` : `/campaigns/${campaign.id}`}
                        className={menuItemClass}
                        onClick={() => setMenuOpen(null)}
                      >
                        <Pencil className="w-4 h-4 text-primary-400 shrink-0" />
                        {campaign.status === 'DRAFT' ? 'Edit draft' : 'Edit'}
                      </Link>
                      <Link
                        role="menuitem"
                        to={`/campaigns/${campaign.id}/edit`}
                        className={menuItemClass}
                        onClick={() => setMenuOpen(null)}
                      >
                        <Pencil className="w-4 h-4 text-primary-400 shrink-0" />
                        Open builder
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          duplicateMutation.mutate(campaign.id);
                          setMenuOpen(null);
                        }}
                        className={menuItemClass}
                        data-testid="campaign-duplicate"
                      >
                        <Copy className="w-4 h-4 text-primary-400 shrink-0" />
                        Duplicate
                      </button>
                      <a
                        role="menuitem"
                        href={`/c/${campaign.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className={menuItemClass}
                        onClick={() => setMenuOpen(null)}
                      >
                        <ExternalLink className="w-4 h-4 text-primary-400 shrink-0" />
                        Public page
                      </a>

                      <div className="my-1 h-px bg-primary-500/20" />

                      {campaign.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            statusMutation.mutate({ id: campaign.id, status: 'PAUSED' });
                            setMenuOpen(null);
                          }}
                          className={cn(menuItemClass, 'text-amber-400 hover:text-amber-300')}
                          data-testid="campaign-pause"
                        >
                          <Pause className="w-4 h-4 shrink-0" />
                          Pause
                        </button>
                      ) : campaign.status !== 'ENDED' && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            statusMutation.mutate({ id: campaign.id, status: 'ACTIVE' });
                            setMenuOpen(null);
                          }}
                          className={cn(menuItemClass, 'text-emerald-400 hover:text-emerald-300')}
                          data-testid="campaign-activate"
                        >
                          <Play className="w-4 h-4 shrink-0" />
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDeleteModal(campaign.id);
                          setMenuOpen(null);
                        }}
                        className={cn(menuItemClass, 'text-red-400 hover:text-red-300')}
                        data-testid="campaign-delete"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          data-testid="campaigns-empty"
          icon={<Gift className="w-5 h-5" />}
          title="No campaigns found"
          description={search || status ? 'Try adjusting your filters' : 'Create a giveaway from scratch or a template. You can save a draft before publishing.'}
          action={!search && !status ? (
            <Link to={billing.data?.needsPlan ? '/choose-plan' : '/campaigns/new'}>
              <Button>
                <Plus className="w-4 h-4" />
                {billing.data?.needsPlan ? 'Start 7-day trial' : 'Create campaign'}
              </Button>
            </Link>
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
