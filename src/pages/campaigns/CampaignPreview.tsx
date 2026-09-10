import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { campaignApi, publicApi } from '../../services/api';
import { GiveawayExperience, PreviewEntryForm } from '../../campaign/GiveawayExperience';
import { PageSpinner } from '../../components/ui';

function PreviewShell({ campaign, errorLabel }: { campaign?: any; errorLabel: string }) {
  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex, nofollow');
    if (!robots.parentElement) document.head.appendChild(robots);
  }, []);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center p-6">
        <div>
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h1 className="text-xl font-semibold">{errorLabel}</h1>
          <p className="text-zinc-500 mt-2">Unpublished campaigns stay private. This preview requires an owner session or a short-lived token.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-amber-500 text-zinc-950 text-center text-sm py-2 font-medium">
        Preview only — entries, secret codes, and spins are disabled
      </div>
      <GiveawayExperience
        campaign={campaign}
        mode="preview"
        main={<PreviewEntryForm campaign={campaign} />}
      />
    </div>
  );
}

export function TokenCampaignPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-preview', token],
    queryFn: () => publicApi.getPreview(token!),
    enabled: Boolean(token),
    retry: false,
  });

  if (isLoading) return <PageSpinner />;
  return <PreviewShell campaign={isError ? undefined : data?.data?.data} errorLabel="Preview unavailable" />;
}

export function OwnerCampaignPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner-preview', id],
    queryFn: () => campaignApi.getPreview(id!),
    enabled: Boolean(id),
    retry: false,
  });

  if (isLoading) return <PageSpinner />;
  return <PreviewShell campaign={isError ? undefined : data?.data?.data} errorLabel="Preview unavailable" />;
}
