import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gift, Trophy, Users, Settings, Code, ExternalLink, Play, Pause, KeyRound, ListOrdered, Award, BarChart3, LayoutTemplate, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, PageSpinner, Stat } from '../../components/ui';
import { campaignApi } from '../../services/api';
import { formatNumber } from '../../utils/formatters';
import { apiErrorMessage, statusColors } from './detail/constants';
import { OverviewTab } from './detail/OverviewTab';
import { ParticipantsTab } from './detail/ParticipantsTab';
import { EntriesTab } from './detail/EntriesTab';
import { ActionsTab } from './detail/ActionsTab';
import { PrizesTab } from './detail/PrizesTab';
import { SecretCodesTab } from './detail/SecretCodesTab';
import { SpinWheelTab } from './detail/SpinWheelTab';
import { WinnersTab } from './detail/WinnersTab';
import { FraudTab } from './detail/FraudTab';
import { AnalyticsTab } from './detail/AnalyticsTab';
import { EmbedTab } from './detail/EmbedTab';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'entries', label: 'Entries', icon: ListOrdered },
  { id: 'actions', label: 'Actions', icon: Gift },
  { id: 'prizes', label: 'Prizes', icon: Trophy },
  { id: 'codes', label: 'Secret Codes', icon: KeyRound },
  { id: 'spinwheel', label: 'Spin Wheel', icon: Gift },
  { id: 'winners', label: 'Winners', icon: Award },
  { id: 'fraud', label: 'Fraud', icon: ShieldAlert },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'embed', label: 'Publishing', icon: Code },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.getById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => campaignApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Status updated');
    },
    onError: (error: any) => toast.error(apiErrorMessage(error, 'Could not update status')),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !campaign?.data?.data) return <div>Campaign not found</div>;

  const data = campaign.data.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => navigate('/campaigns')}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{data.title}</h1>
            <Badge variant={statusColors[data.status]} data-testid="campaign-status">{data.status}</Badge>
          </div>
          <p className="text-zinc-400 mt-1" data-testid="campaign-public-slug">/{data.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" data-testid="open-builder" onClick={() => navigate(`/campaigns/${data.id}/edit`)}>
            <LayoutTemplate className="w-4 h-4" />
            Open Builder
          </Button>
          <a
            href={`/c/${data.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary h-10 px-4 text-sm inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Live
          </a>
          {data.status === 'ACTIVE' ? (
            <Button variant="secondary" onClick={() => statusMutation.mutate('PAUSED')} loading={statusMutation.isPending}>
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          ) : data.status !== 'ENDED' && (
            <Button onClick={() => statusMutation.mutate('ACTIVE')} loading={statusMutation.isPending}>
              <Play className="w-4 h-4" />
              Activate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat label="Participants" value={formatNumber(data._count?.participants || 0)} />
        <Stat label="Entries" value={formatNumber(data._count?.entries || 0)} />
        <Stat label="Winners" value={formatNumber(data._count?.winners || 0)} />
        <Stat label="Prizes" value={formatNumber(data.prizes?.length || 0)} />
      </div>

      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-500 text-zinc-50'
                : 'border-transparent text-zinc-500 hover:text-zinc-200'
            }`}
            data-testid={`campaign-tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab key={data.updatedAt} campaignId={id!} data={data} />}
      {activeTab === 'participants' && <ParticipantsTab campaignId={id!} />}
      {activeTab === 'entries' && <EntriesTab campaignId={id!} actions={data.entryActions || []} />}
      {activeTab === 'actions' && <ActionsTab campaignId={id!} actions={data.entryActions || []} />}
      {activeTab === 'prizes' && <PrizesTab campaignId={id!} prizes={data.prizes || []} />}
      {activeTab === 'codes' && <SecretCodesTab campaignId={id!} />}
      {activeTab === 'spinwheel' && <SpinWheelTab campaignId={id!} data={data} />}
      {activeTab === 'winners' && <WinnersTab campaignId={id!} prizes={data.prizes || []} />}
      {activeTab === 'fraud' && <FraudTab campaignId={id!} />}
      {activeTab === 'analytics' && <AnalyticsTab campaignId={id!} />}
      {activeTab === 'embed' && <EmbedTab campaignId={id!} slug={data.slug} status={data.status} />}
    </div>
  );
}
