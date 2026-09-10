import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  Gift,
  Mail,
  User,
  Phone,
  Trophy,
  Shield,
} from 'lucide-react';
import { publicApi, spinWheelApi } from '../../services/api';
import { campaignViewPayload, getAnonymousVisitorId } from '../../utils/visitorTracking';
import { formatNumber } from '../../utils/formatters';
import { SpinWheel } from '../../components/SpinWheel';
import { Leaderboard } from '../../components/giveaway/Leaderboard';
import { SecretCodeForm } from '../../components/giveaway/SecretCodeForm';
import { CampaignThemeRoot } from '../../campaign/CampaignThemeRoot';
import { CustomFieldsForm } from '../../campaign/CustomFieldsForm';
import { ConsentFields } from '../../campaign/ConsentFields';
import { ActionRunner } from '../../campaign/ActionRunner';
import { ReferralPanel } from '../../campaign/ReferralPanel';
import {
  saveParticipantSession,
  loadParticipantSession,
  clearParticipantSession,
} from '../../utils/participantSession';
import { applyQueryPrefill } from '../../campaign/prefill';
import { mergePhoneIntoCustomFields, visibleCustomFields } from '../../campaign/phoneFields';
import { mapWheelSegments, publicSpinSegments } from '../../campaign/spinSegments';
import { SpinLockedTeaser } from '../../campaign/PreviewSpinWheel';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

function WidgetContent() {
  const { slug } = useParams<{ slug: string }>();
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

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['widget-campaign', slug],
    queryFn: () => publicApi.getCampaign(slug!),
    enabled: !!slug,
  });

  const { data: segmentsData, isLoading: segmentsLoading } = useQuery({
    queryKey: ['widget-spin-segments', campaign?.data?.data?.id],
    queryFn: () => spinWheelApi.getSegments(campaign?.data?.data?.id),
    enabled: !!campaign?.data?.data?.id && !!campaign?.data?.data?.enableSpinWheel,
  });

  const { data: spinStatusData, refetch: refetchSpinStatus } = useQuery({
    queryKey: ['widget-spin-status', campaign?.data?.data?.id, participant?.id],
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
    if (!slug || !campaign?.data?.data?.id) return;
    publicApi.trackEvent(slug, campaignViewPayload('WIDGET_VIEW')).catch(() => undefined);
  }, [slug, campaign?.data?.data?.id]);

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      return undefined;
    }
    return await executeRecaptcha('enter');
  }, [executeRecaptcha]);

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
      notifyParentResize();
    },
  });

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

  // Notify parent window of height changes for iframe resizing
  const notifyParentResize = () => {
    if (window.parent !== window) {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ source: 'promoapp', type: 'promoapp-resize', height }, '*');
    }
  };

  useEffect(() => {
    notifyParentResize();
    const observer = new ResizeObserver(() => notifyParentResize());
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [participant, completedActions, campaign?.data?.data?.theme, campaign?.data?.data?.customCss, campaign?.data?.data?.logoUrl]);

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

  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-zinc-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-zinc-700 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign?.data?.data) {
    return (
      <div className="min-h-[300px] bg-zinc-900 flex items-center justify-center p-4 text-center">
        <div>
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Giveaway not available</p>
        </div>
      </div>
    );
  }

  const data = campaign.data.data;
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
    notifyParentResize();
    return result;
  };

  return (
    <CampaignThemeRoot campaign={data} className="p-4 min-h-[400px]">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-2" style={{ background: 'color-mix(in srgb, var(--c-primary) 16%, transparent)', color: 'var(--c-primary)' }}>
          <Gift className="w-3 h-3" />
          GIVEAWAY
        </div>
        {data.logoUrl && <img src={data.logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />}
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>{data.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>{formatNumber(data.totalEntries)} entries</p>
      </div>

      {data.prizes?.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-center">
          {data.prizes.map((prize: any) => (
            <li key={prize.id}>
              <Trophy className="w-3 h-3 inline mr-1" />
              {prize.name}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence mode="wait">
        {!participant ? (
          /* Entry Form */
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleEnter}
            className="space-y-3"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="Email"
                data-testid="giveaway-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            {data.requireName && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Name"
                  data-testid="giveaway-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            )}
            {data.requirePhone && (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Phone (e.g. 03031234567)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            )}
            <CustomFieldsForm fields={visibleCustomFields(data.customFormFields, data.requirePhone)} values={customFields} onChange={setCustomFields} />
            <ConsentFields campaign={data} consent={consent} onChange={setConsent} />
            <button
              type="submit"
              data-testid="giveaway-enter"
              disabled={enterMutation.isPending}
              className="w-full py-2.5 text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: 'var(--c-button)', color: 'var(--c-button-text)', borderRadius: 'var(--c-radius)' }}
            >
              {enterMutation.isPending ? 'Entering...' : 'Enter Giveaway'}
            </button>
            {data.enableCaptcha && (
              <p className="text-[11px] text-center flex items-center justify-center gap-1" style={{ color: 'var(--c-muted)' }}>
                <Shield className="w-3 h-3" />
                Protected by reCAPTCHA
              </p>
            )}
            {data.enableSpinWheel && (
              <SpinLockedTeaser caption="Enter the giveaway to unlock your spin." />
            )}
          </motion.form>
        ) : (
          /* Actions */
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Points */}
            <div className="text-center py-1">
              <p className="text-2xl font-semibold tabular-nums" data-testid="participant-points">{participant.totalPoints}</p>
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>entries</p>
            </div>

            {data.enableReferrals && (
              <ReferralPanel
                url={referralUrl}
                title={`Enter ${data.title}`}
                bonusPoints={data.referralBonusPoints || 5}
                referralsCount={participant.referralsCount || 0}
                referralPoints={participant.referralPoints || 0}
                compact
              />
            )}

            {data.entryActions?.some((action: any) => action.type === 'SECRET_CODE') && sessionToken && (
              <SecretCodeForm
                slug={slug!}
                participantId={participant.id}
                token={sessionToken}
                compact
                onRedeemed={(points, actionId) => {
                  setParticipant((prev: any) => ({
                    ...prev,
                    totalPoints: prev.totalPoints + points,
                  }));
                  if (actionId) {
                    setCompletedActions((prev) => new Set([...prev, actionId]));
                  }
                  queryClient.invalidateQueries({ queryKey: ['leaderboard', slug] });
                  notifyParentResize();
                }}
              />
            )}

            {/* Actions */}
            {sessionToken && (
              <ActionRunner
                slug={slug!}
                actions={data.entryActions || []}
                participant={participant}
                sessionToken={sessionToken}
                completedActions={completedActions}
                compact
                onCompleted={(actionId, points) => {
                  setCompletedActions((prev) => new Set([...prev, actionId]));
                  setParticipant((prev: any) => ({ ...prev, totalPoints: (prev.totalPoints || 0) + points }));
                  queryClient.invalidateQueries({ queryKey: ['leaderboard', slug] });
                  notifyParentResize();
                  publicApi.getMe(slug!, sessionToken).then((response) => {
                    if (response.data.data) {
                      setParticipant(response.data.data);
                      setCompletedActions(new Set(response.data.data.completedActions || []));
                    }
                  }).catch(() => undefined);
                }}
              />
            )}

            {data.enableSpinWheel && (
              <div className="pt-2 text-center">
                <p className="text-sm font-medium">Bonus spin</p>
                {spinsLeft > 0 && spinSegments.length > 0 ? (
                  <>
                    <p className="text-xs mb-2" style={{ color: 'var(--c-muted)' }}>{spinsLeft} left today</p>
                    <div className="flex justify-center">
                      <SpinWheel
                        segments={mapWheelSegments(spinSegments)}
                        onSpin={runSpin}
                        spinsRemaining={spinsLeft}
                        size={180}
                        disabled={!sessionToken || spinsLeft <= 0}
                      />
                    </div>
                  </>
                ) : spinsLeft > 0 && segmentsLoading ? (
                  <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Loading spin…</p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--c-muted)' }}>No spins left today.</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <Leaderboard slug={slug!} compact enabled={data.showLeaderboard !== false} />
      </div>

      {/* Legal */}
      {(data.officialRules || data.termsConditions || data.privacyPolicy) && (
        <div className="mt-4 pt-3 border-t text-[11px] space-y-1" style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 30%, transparent)', color: 'var(--c-muted)' }}>
          {data.officialRules && (
            <details>
              <summary className="cursor-pointer">Official rules</summary>
              <pre className="whitespace-pre-wrap mt-1 font-sans">{data.officialRules}</pre>
            </details>
          )}
          {data.termsConditions && (
            <details>
              <summary className="cursor-pointer">Terms</summary>
              <p className="mt-1 whitespace-pre-wrap">{data.termsConditions}</p>
            </details>
          )}
          {data.privacyPolicy && (
            <details>
              <summary className="cursor-pointer">Privacy</summary>
              <p className="mt-1 whitespace-pre-wrap">{data.privacyPolicy}</p>
            </details>
          )}
        </div>
      )}
    </CampaignThemeRoot>
  );
}

export function WidgetPage() {
  if (RECAPTCHA_SITE_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <WidgetContent />
      </GoogleReCaptchaProvider>
    );
  }

  return <WidgetContent />;
}

