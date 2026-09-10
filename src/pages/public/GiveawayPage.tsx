import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Gift, Mail, User, Phone, Shield, Star, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicApi, spinWheelApi } from '../../services/api';
import { campaignViewPayload, getAnonymousVisitorId } from '../../utils/visitorTracking';
import { formatNumber, formatDate } from '../../utils/formatters';
import { SpinWheel } from '../../components/SpinWheel';
import { SecretCodeForm } from '../../components/giveaway/SecretCodeForm';
import { SpinHistory } from '../../components/giveaway/SpinHistory';
import { Leaderboard } from '../../components/giveaway/Leaderboard';
import { CustomFieldsForm } from '../../campaign/CustomFieldsForm';
import { ConsentFields } from '../../campaign/ConsentFields';
import { ActionRunner } from '../../campaign/ActionRunner';
import { ProgressPanel } from '../../campaign/ProgressPanel';
import { ReferralPanel } from '../../campaign/ReferralPanel';
import { CampaignThemeRoot } from '../../campaign/CampaignThemeRoot';
import { TrackingPixels } from '../../campaign/TrackingPixels';
import { sanitizeHeroMedia } from '../../campaign/heroMedia';
import { PreviewSpinWheel, SpinLockedTeaser } from '../../campaign/PreviewSpinWheel';
import {
  saveParticipantSession,
  loadParticipantSession,
  clearParticipantSession,
} from '../../utils/participantSession';
import { applyQueryPrefill } from '../../campaign/prefill';
import { mergePhoneIntoCustomFields, visibleCustomFields } from '../../campaign/phoneFields';
import { mapWheelSegments, publicSpinSegments } from '../../campaign/spinSegments';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

function GiveawayContent({ forcedSlug }: { forcedSlug?: string }) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = forcedSlug || paramSlug;
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { executeRecaptcha } = useGoogleReCaptcha();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [consent, setConsent] = useState<{ terms?: boolean; privacy?: boolean; rules?: boolean }>({});
  const [participant, setParticipant] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [spinsRemaining, setSpinsRemaining] = useState<number | null>(null);
  const [spinSessionActive, setSpinSessionActive] = useState(false);

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['public-campaign', slug],
    queryFn: () => publicApi.getCampaign(slug!),
    enabled: !!slug,
  });

  const { data: segmentsData } = useQuery({
    queryKey: ['spin-segments', campaign?.data?.data?.id],
    queryFn: () => spinWheelApi.getSegments(campaign?.data?.data?.id),
    enabled: !!campaign?.data?.data?.id && !!campaign?.data?.data?.enableSpinWheel,
  });

  const { data: spinStatusData, refetch: refetchSpinStatus } = useQuery({
    queryKey: ['spin-status', campaign?.data?.data?.id, participant?.id],
    queryFn: () => spinWheelApi.getStatus(campaign?.data?.data?.id, participant?.id, sessionToken!),
    enabled: !!campaign?.data?.data?.id && !!participant?.id && !!sessionToken && !!campaign?.data?.data?.enableSpinWheel,
  });

  useEffect(() => {
    const remaining = spinStatusData?.data?.data?.spinsRemaining;
    if (typeof remaining === 'number') {
      setSpinsRemaining(remaining);
    }
  }, [spinStatusData]);

  useEffect(() => {
    if (!participant) {
      setSpinSessionActive(false);
      return;
    }
    const left = spinsRemaining ?? (Number(campaign?.data?.data?.spinsPerDay) || 1);
    if (left > 0) setSpinSessionActive(true);
  }, [participant, spinsRemaining, campaign?.data?.data?.spinsPerDay]);

  useEffect(() => {
    if (!slug || !campaign?.data?.data?.id) return;
    publicApi.trackEvent(slug, campaignViewPayload('HOSTED_VIEW')).catch(() => undefined);
  }, [slug, campaign?.data?.data?.id]);

  const enterMutation = useMutation({
    mutationFn: (data: any) => publicApi.enter(slug!, data),
    onSuccess: (response) => {
      const data = response.data.data;
      setParticipant(data);
      setSessionToken(data.sessionToken);
      if (slug && data.sessionToken) {
        saveParticipantSession(slug, {
          token: data.sessionToken,
          participantId: data.id,
          campaignId: data.campaignId,
        });
      }
      toast.success('You’re in. Complete actions to earn more entries.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to enter');
    },
  });

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      return undefined;
    }
    return await executeRecaptcha('enter');
  }, [executeRecaptcha]);

  useEffect(() => {
    if (!slug) return;
    const session = loadParticipantSession(slug);
    if (!session?.token) return;

    publicApi.getMe(slug, session.token).then((response) => {
      if (response.data.data) {
        setSessionToken(session.token);
        setParticipant(response.data.data);
        setCompletedActions(new Set(response.data.data.completedActions || []));
      }
    }).catch(() => {
      clearParticipantSession(slug);
      setSessionToken(null);
      setParticipant(null);
    });
  }, [slug]);

  useEffect(() => {
    const data = campaign?.data?.data;
    if (!slug || !data || participant) return;
    if (loadParticipantSession(slug)?.token) return;
    const next = applyQueryPrefill({
      allowPrefill: data.allowPrefill,
      hasSession: false,
      searchParams,
      customFields: data.customFormFields,
    });
    if (next.email) setEmail(next.email);
    if (next.name) setName(next.name);
    if (next.phone) setPhone(next.phone);
    if (Object.keys(next.customFields).length) {
      setCustomFields((prev) => ({ ...next.customFields, ...prev }));
    }
  }, [slug, campaign?.data?.data, participant, searchParams]);

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    let captchaToken: string | undefined;
    if (campaign?.data?.data?.enableCaptcha && executeRecaptcha) {
      captchaToken = await handleReCaptchaVerify();
    }
    enterMutation.mutate({
      email,
      name: name || undefined,
      phone: phone || undefined,
      referralCode: referralCode || undefined,
      captchaToken,
      customFields: mergePhoneIntoCustomFields(campaign?.data?.data?.customFormFields, customFields, phone),
      consent,
      visitorId: getAnonymousVisitorId(),
    });
  };

  const referralUrl = campaign?.data?.data?.publicUrl
    ? `${campaign.data.data.publicUrl}${campaign.data.data.publicUrl.includes('?') ? '&' : '?'}ref=${participant?.referralCode || ''}`
    : '';

  if (!slug || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign?.data?.data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Gift className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h1 className="text-xl font-semibold">Campaign not found</h1>
          <p className="text-zinc-400 mt-2 text-sm">This giveaway may have ended or doesn’t exist.</p>
        </div>
      </div>
    );
  }

  const data = campaign.data.data;
  const hero = sanitizeHeroMedia(data);
  const prizes = Array.isArray(data.prizes) ? data.prizes : [];
  const spinSegments = publicSpinSegments(data, segmentsData);
  const spinsLeft = spinsRemaining ?? (Number(data.spinsPerDay) || 1);

  const runSpin = async () => {
    const response = await spinWheelApi.spin(data.id, participant.id, sessionToken!);
    const result = response.data.data;
    if (result.success && result.segment.rewardType === 'BONUS_ENTRIES') {
      setParticipant((prev: any) => ({
        ...prev,
        totalPoints: prev.totalPoints + parseInt(result.segment.rewardValue || '0', 10),
      }));
    }
    setSpinsRemaining(result.spinsRemaining);
    refetchSpinStatus();
    queryClient.invalidateQueries({ queryKey: ['spin-history', participant.id] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard', slug] });
    return result;
  };

  const entryForm = (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--c-heading)' }}>Enter to win</h2>
      <form onSubmit={handleEnter} className="space-y-3.5">
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="email"
            placeholder="Your email address"
            data-testid="giveaway-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)', borderRadius: 'var(--c-radius)' }}
          />
        </div>
        {data.requireName && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Your name"
              data-testid="giveaway-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)', borderRadius: 'var(--c-radius)' }}
            />
          </div>
        )}
        {data.requirePhone && (
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Phone (e.g. 03031234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)', borderRadius: 'var(--c-radius)' }}
            />
          </div>
        )}
        <CustomFieldsForm fields={visibleCustomFields(data.customFormFields, data.requirePhone)} values={customFields} onChange={setCustomFields} />
        <ConsentFields campaign={data} consent={consent} onChange={setConsent} />
        <button
          type="submit"
          data-testid="giveaway-enter"
          disabled={enterMutation.isPending}
          className="w-full py-3 px-6 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--c-button)', color: 'var(--c-button-text)', borderRadius: 'var(--c-radius)' }}
        >
          {enterMutation.isPending ? 'Entering...' : 'Enter giveaway'}
        </button>
        {data.enableCaptcha && (
          <p className="text-xs text-center flex items-center justify-center gap-1" style={{ color: 'var(--c-muted)' }}>
            <Shield className="w-3 h-3" />
            Protected by reCAPTCHA
          </p>
        )}
      </form>
      {data.enableSpinWheel && (
        <SpinLockedTeaser caption="Enter the giveaway to unlock your spin." />
      )}
    </div>
  );

  const postEntry = participant ? (
    <div className="space-y-6">
      <div>
        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>You’re in</p>
        <p className="text-2xl font-semibold tabular-nums mt-1" data-testid="participant-points">
          {participant.totalPoints} <span className="text-base font-medium" style={{ color: 'var(--c-muted)' }}>entries</span>
        </p>
      </div>

      <ProgressPanel participant={participant} campaign={data} />

      {sessionToken && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Earn more entries</h3>
          <ActionRunner
            slug={slug!}
            actions={data.entryActions || []}
            participant={participant}
            sessionToken={sessionToken}
            completedActions={completedActions}
            onCompleted={(actionId, points) => {
              setCompletedActions((prev) => new Set([...prev, actionId]));
              setParticipant((prev: any) => ({ ...prev, totalPoints: (prev.totalPoints || 0) + points }));
              queryClient.invalidateQueries({ queryKey: ['leaderboard', slug] });
              publicApi.getMe(slug!, sessionToken).then((response) => {
                if (response.data.data) {
                  setParticipant(response.data.data);
                  setCompletedActions(new Set(response.data.data.completedActions || []));
                }
              }).catch(() => undefined);
            }}
          />
        </div>
      )}

      {data.entryActions?.some((action: any) => action.type === 'SECRET_CODE') && sessionToken && (
        <SecretCodeForm
          slug={slug!}
          participantId={participant.id}
          token={sessionToken}
          onRedeemed={(points, actionId) => {
            setParticipant((prev: any) => ({
              ...prev,
              totalPoints: prev.totalPoints + points,
            }));
            if (actionId) {
              setCompletedActions((prev) => new Set([...prev, actionId]));
            }
            queryClient.invalidateQueries({ queryKey: ['leaderboard', slug] });
          }}
        />
      )}

      {data.enableReferrals && (
        <ReferralPanel
          url={referralUrl}
          title={`Enter ${data.title}`}
          bonusPoints={data.referralBonusPoints || 5}
          referralsCount={participant.referralsCount || 0}
          referralPoints={participant.referralPoints || 0}
        />
      )}

      {data.enableSpinWheel && (
        <div className="pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 22%, transparent)' }}>
          <h3 className="text-sm font-semibold">Bonus spin</h3>
          {spinSegments.length > 0 && (spinsLeft > 0 || spinSessionActive) ? (
            <>
              <p className="text-sm mt-1 mb-4" style={{ color: 'var(--c-muted)' }}>
                {spinsLeft > 0
                  ? `You have ${spinsLeft} spin${spinsLeft !== 1 ? 's' : ''} today.`
                  : 'Showing your spin result.'}
              </p>
              <div className="flex justify-center">
                <SpinWheel
                  segments={mapWheelSegments(spinSegments)}
                  onSpin={runSpin}
                  spinsRemaining={spinsLeft}
                  size={260}
                  disabled={!sessionToken || spinsLeft <= 0}
                />
              </div>
            </>
          ) : spinsLeft > 0 ? (
            <PreviewSpinWheel
              campaign={{ ...data, spinWheelSegments: spinSegments }}
              size={220}
              caption="The wheel loads after you enter."
            />
          ) : (
            <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
              No spins left today. Come back tomorrow, or complete remaining actions for more entries.
            </p>
          )}
          {sessionToken && <div className="mt-4"><SpinHistory participantId={participant.id} token={sessionToken} /></div>}
        </div>
      )}
    </div>
  ) : null;

  return (
    <CampaignThemeRoot campaign={data} className="min-h-screen">
      <TrackingPixels
        pixels={data.pixels}
        requireLegalAcceptance={data.requireLegalAcceptance}
        privacyAccepted={!data.requireLegalAcceptance}
      />
      <div className="max-w-lg mx-auto px-4 pt-10 pb-6 text-center">
        {data.logoUrl && (
          <img src={data.logoUrl} alt="" className="h-10 mx-auto mb-5 object-contain" />
        )}
        {hero.kind === 'image' && (
          <img
            src={hero.src}
            alt=""
            className="w-full max-h-64 object-cover mb-6 mx-auto"
            style={{ borderRadius: 'var(--c-radius)' }}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        {(hero.kind === 'youtube' || hero.kind === 'vimeo') && (
          <div className="mt-5 aspect-video rounded-xl overflow-hidden">
            <iframe title="Featured video" src={hero.src} className="w-full h-full" allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        )}
        {hero.kind === 'video' && (
          <div className="mt-5 aspect-video rounded-xl overflow-hidden">
            <video src={hero.src} controls className="w-full h-full" />
          </div>
        )}
        <p className="text-xs font-medium uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--c-primary)' }}>
          Giveaway
        </p>
        <h1 className="text-3xl md:text-4xl leading-tight font-semibold mb-3" style={{ fontFamily: 'var(--c-heading, inherit)' }}>{data.title}</h1>
        {data.description && (
          <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>{data.description}</p>
        )}
        {prizes.length > 0 && (
          <ul className="mt-6 space-y-1.5 text-sm">
            {prizes.map((prize: any) => (
              <li key={prize.id || prize.name} className="flex items-center justify-center gap-2">
                <Star className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--c-accent)' }} />
                <span>
                  {prize.name}
                  {prize.quantity > 1 ? ` · ${prize.quantity} winners` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-center gap-5 mt-5 text-sm" style={{ color: 'var(--c-muted)' }}>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{formatNumber(Number(data.totalEntries) || 0)} entries</span>
          {data.endDate && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Ends {formatDate(data.endDate)}</span>}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pb-16 text-left">
        {!participant ? entryForm : postEntry}
        {data.slug && data.showLeaderboard !== false && (
          <div className="mt-8">
            <Leaderboard slug={data.slug} />
          </div>
        )}
      </div>
      {(data.officialRules || data.termsConditions || data.privacyPolicy) && (
        <div className="max-w-lg mx-auto px-4 pb-10 text-xs space-y-2" style={{ color: 'var(--c-muted)' }}>
          {data.officialRules && (
            <details>
              <summary className="cursor-pointer font-medium">Official rules</summary>
              <pre className="whitespace-pre-wrap mt-2 font-sans">{data.officialRules}</pre>
            </details>
          )}
          {data.termsConditions && (
            <details>
              <summary className="cursor-pointer font-medium">Terms</summary>
              <p className="mt-2 whitespace-pre-wrap">{data.termsConditions}</p>
            </details>
          )}
          {data.privacyPolicy && (
            <details>
              <summary className="cursor-pointer font-medium">Privacy</summary>
              <p className="mt-2 whitespace-pre-wrap">{data.privacyPolicy}</p>
            </details>
          )}
        </div>
      )}
    </CampaignThemeRoot>
  );
}

export function GiveawayPage({ forcedSlug }: { forcedSlug?: string } = {}) {
  if (RECAPTCHA_SITE_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <GiveawayContent forcedSlug={forcedSlug} />
      </GoogleReCaptchaProvider>
    );
  }

  return <GiveawayContent forcedSlug={forcedSlug} />;
}
