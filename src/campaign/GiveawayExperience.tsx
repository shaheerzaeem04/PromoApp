import type { ReactNode } from 'react';
import { Mail, User, Phone, Users, Clock, Star, Shield } from 'lucide-react';
import { formatNumber, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { CampaignThemeRoot } from './CampaignThemeRoot';
import { Leaderboard } from '../components/giveaway/Leaderboard';
import { CustomFieldsForm } from './CustomFieldsForm';
import { ConsentFields } from './ConsentFields';
import { TrackingPixels } from './TrackingPixels';
import { sanitizeHeroMedia } from './heroMedia';
import { PreviewSpinWheel } from './PreviewSpinWheel';
import { visibleCustomFields } from './phoneFields';

interface GiveawayExperienceProps {
  campaign: any;
  mode: 'live' | 'widget' | 'preview';
  displayModeOverride?: string;
  previewState?: 'page' | 'popup' | 'success' | 'returning';
  main: ReactNode;
  afterMain?: ReactNode;
}

export function GiveawayExperience({ campaign, mode, displayModeOverride, previewState, main, afterMain }: GiveawayExperienceProps) {
  const displayMode = displayModeOverride || (previewState === 'popup' ? 'POPUP' : campaign.displayMode) || 'INLINE';
  const hero = sanitizeHeroMedia(campaign);
  const isWidget = mode === 'widget';
  const framed = mode === 'preview' && displayMode !== 'INLINE';
  const prizes = Array.isArray(campaign.prizes) ? campaign.prizes : [];

  const inner = (
    <CampaignThemeRoot campaign={campaign} className={isWidget ? 'min-h-[400px] p-4' : 'min-h-screen'}>
      <TrackingPixels
        pixels={campaign.pixels}
        requireLegalAcceptance={campaign.requireLegalAcceptance}
        privacyAccepted={!campaign.requireLegalAcceptance}
      />
      {!isWidget && (
        <div className="relative">
          <div className="max-w-lg mx-auto px-4 pt-10 pb-6 text-center">
            {campaign.logoUrl && (
              <img src={campaign.logoUrl} alt="" className="h-10 mx-auto mb-5 object-contain" />
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
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--c-primary)' }}>
              Giveaway
            </p>
            <h1 className="text-3xl md:text-4xl leading-tight font-semibold mb-3" style={{ fontFamily: 'var(--c-heading, inherit)' }}>{campaign.title}</h1>
            {campaign.description && (
              <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>{campaign.description}</p>
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
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{formatNumber(Number(campaign.totalEntries) || 0)} entries</span>
              {campaign.endDate && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Ends {formatDate(campaign.endDate)}</span>}
            </div>
          </div>
        </div>
      )}

      {isWidget && (
        <div className="text-center mb-4">
          {campaign.logoUrl && <img src={campaign.logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />}
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>{campaign.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>{formatNumber(campaign.totalEntries || 0)} entries</p>
        </div>
      )}

      <div className={cn(isWidget ? '' : 'max-w-lg mx-auto px-4 pb-16')}>
        <div className="space-y-6">
          {previewState === 'success' ? <PreviewSuccessState campaign={campaign} /> : main}
          {afterMain}
          {!isWidget && campaign.slug && mode !== 'preview' && campaign.showLeaderboard !== false && (
            <Leaderboard slug={campaign.slug} />
          )}
          {mode === 'preview' && campaign.showLeaderboard !== false && (
            <p className="text-sm text-center" style={{ color: 'var(--c-muted)' }}>Leaderboard appears after publish.</p>
          )}
        </div>
      </div>

      {(campaign.officialRules || campaign.termsConditions || campaign.privacyPolicy) && (
        <div className="max-w-lg mx-auto px-4 pb-10 text-xs space-y-2" style={{ color: 'var(--c-muted)' }}>
          {campaign.officialRules && (
            <details>
              <summary className="cursor-pointer font-medium">Official rules</summary>
              <pre className="whitespace-pre-wrap mt-2 font-sans">{campaign.officialRules}</pre>
            </details>
          )}
          {campaign.termsConditions && (
            <details>
              <summary className="cursor-pointer font-medium">Terms</summary>
              <p className="mt-2 whitespace-pre-wrap">{campaign.termsConditions}</p>
            </details>
          )}
          {campaign.privacyPolicy && (
            <details>
              <summary className="cursor-pointer font-medium">Privacy</summary>
              <p className="mt-2 whitespace-pre-wrap">{campaign.privacyPolicy}</p>
            </details>
          )}
        </div>
      )}
    </CampaignThemeRoot>
  );

  if (!framed) return inner;

  if (displayMode === 'POPUP') {
    return (
      <div className="min-h-full bg-black/70 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90%] overflow-auto rounded-2xl shadow-2xl">{inner}</div>
      </div>
    );
  }
  if (displayMode === 'BANNER') {
    const bottom = campaign.bannerPosition === 'bottom';
    return (
      <div className="min-h-full bg-zinc-800 relative">
        <div className={cn('absolute left-0 right-0 max-h-[70%] overflow-auto shadow-xl', bottom ? 'bottom-0' : 'top-0')}>{inner}</div>
      </div>
    );
  }
  if (displayMode === 'SLIDE_IN') {
    return (
      <div className="min-h-full bg-zinc-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-auto shadow-2xl">{inner}</div>
      </div>
    );
  }
  return inner;
}

export function PreviewSuccessState({ campaign }: { campaign: any }) {
  return (
    <div className="space-y-5" data-testid="preview-success">
      <div>
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>You’re in</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--c-muted)' }}>
          {campaign.postEntryMessage || 'This is a preview of the post-entry screen. No participant was created.'}
        </p>
      </div>
      <p className="text-sm">Next: complete actions, invite friends, and track your points.</p>
      <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Sample referral link: {campaign.slug ? `/c/${campaign.slug}?ref=PREVIEW` : '/c/your-campaign?ref=PREVIEW'}</p>
      <PreviewSpinWheel campaign={campaign} size={200} caption="Participants can spin after they enter." />
    </div>
  );
}

export function PreviewReturningState({ campaign }: { campaign: any }) {
  return (
    <div className="space-y-4" data-testid="preview-returning">
      <h2 className="text-xl font-semibold">Welcome back</h2>
      <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Preview of a returning participant. Bonus actions stay available; required actions look completed.</p>
      {(campaign.entryActions || []).map((action: any, index: number) => (
        <div key={action.id || index} className="py-2.5 flex justify-between border-b text-sm" style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 20%, transparent)' }}>
          <span>{action.title}</span>
          <span className="text-emerald-400">{index === 0 ? 'Done' : `+${action.points}`}</span>
        </div>
      ))}
      <PreviewSpinWheel campaign={campaign} size={180} caption="Returning visitors keep their remaining spins." />
    </div>
  );
}

export function PreviewEntryForm({ campaign }: { campaign: any }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>Enter to win</h2>
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-muted)' }} />
        <input disabled placeholder="Your email address" className="w-full pl-11 pr-4 py-3 border bg-transparent" style={{ borderRadius: 'var(--c-radius)', borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)' }} />
      </div>
      {campaign.requireName && (
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-muted)' }} />
          <input disabled placeholder="Your name" className="w-full pl-11 pr-4 py-3 border bg-transparent" style={{ borderRadius: 'var(--c-radius)', borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)' }} />
        </div>
      )}
      {campaign.requirePhone && (
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-muted)' }} />
          <input disabled placeholder="Phone (e.g. 03031234567)" className="w-full pl-11 pr-4 py-3 border bg-transparent" style={{ borderRadius: 'var(--c-radius)', borderColor: 'color-mix(in srgb, var(--c-muted) 35%, transparent)' }} />
        </div>
      )}
      <CustomFieldsForm fields={visibleCustomFields(campaign.customFormFields, campaign.requirePhone)} values={{}} onChange={() => undefined} disabled />
      <ConsentFields campaign={campaign} consent={{}} onChange={() => undefined} disabled />
      <button type="button" className="w-full py-3 font-medium" style={{ background: 'var(--c-button)', color: 'var(--c-button-text)', borderRadius: 'var(--c-radius)' }}>
        Enter giveaway
      </button>
      {campaign.enableCaptcha && (
        <p className="text-xs text-center flex items-center justify-center gap-1" style={{ color: 'var(--c-muted)' }}>
          <Shield className="w-3 h-3" /> Protected by reCAPTCHA
        </p>
      )}
      <PreviewSpinWheel campaign={campaign} locked caption="Enter the giveaway to unlock your spin." />
    </div>
  );
}
