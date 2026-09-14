import type { ReactNode } from 'react';
import { Mail, User, Phone, Users, Clock, Star, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatNumber, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { CampaignThemeRoot } from './CampaignThemeRoot';
import { Leaderboard } from '../components/giveaway/Leaderboard';
import { CustomFieldsForm } from './CustomFieldsForm';
import { ConsentFields } from './ConsentFields';
import { TrackingPixels } from './TrackingPixels';
import { sanitizeHeroMedia, type HeroMedia } from './heroMedia';
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

const easeOut = [0.22, 1, 0.36, 1] as const;

function HeroMediaBlock({ hero }: { hero: HeroMedia }) {
  const frame = { borderRadius: 'var(--c-radius)' };

  switch (hero.kind) {
    case 'none':
      return null;
    case 'image':
      return (
        <img
          src={hero.src}
          alt=""
          className="w-full max-h-64 object-cover mx-auto"
          style={frame}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      );
    case 'youtube':
    case 'vimeo':
      return (
        <div className="aspect-video overflow-hidden" style={frame}>
          <iframe
            title="Featured video"
            src={hero.src}
            className="w-full h-full"
            allow="encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    case 'video':
      return (
        <div className="aspect-video overflow-hidden" style={frame}>
          <video src={hero.src} controls className="w-full h-full" />
        </div>
      );
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

function PrizeList({ prizes }: { prizes: any[] }) {
  if (!prizes.length) return null;
  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--c-muted)' }}>
        Prizes
      </p>
      <ul className="space-y-1.5 text-sm">
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
    </div>
  );
}

function LegalBlock({ campaign }: { campaign: any }) {
  if (!campaign.officialRules && !campaign.termsConditions && !campaign.privacyPolicy) return null;
  return (
    <div className="giveaway-legal max-w-lg mx-auto px-4 pb-10 text-xs space-y-2" style={{ color: 'var(--c-muted)' }}>
      {campaign.officialRules && (
        <details>
          <summary>Official rules</summary>
          <pre className="whitespace-pre-wrap mt-2 font-sans">{campaign.officialRules}</pre>
        </details>
      )}
      {campaign.termsConditions && (
        <details>
          <summary>Terms</summary>
          <p className="mt-2 whitespace-pre-wrap">{campaign.termsConditions}</p>
        </details>
      )}
      {campaign.privacyPolicy && (
        <details>
          <summary>Privacy</summary>
          <p className="mt-2 whitespace-pre-wrap">{campaign.privacyPolicy}</p>
        </details>
      )}
    </div>
  );
}

export function GiveawayExperience({ campaign, mode, displayModeOverride, previewState, main, afterMain }: GiveawayExperienceProps) {
  const reduceMotion = useReducedMotion();
  const displayMode = displayModeOverride || (previewState === 'popup' ? 'POPUP' : campaign.displayMode) || 'INLINE';
  const hero = sanitizeHeroMedia(campaign);
  const isWidget = mode === 'widget';
  const framed = mode === 'preview' && displayMode !== 'INLINE';
  const prizes = Array.isArray(campaign.prizes) ? campaign.prizes : [];

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.32, ease: easeOut } };

  const inner = (
    <CampaignThemeRoot
      campaign={campaign}
      className={cn(
        isWidget && 'min-h-[400px] p-4',
        !isWidget && !framed && 'min-h-screen',
        framed && 'overflow-hidden'
      )}
    >
      <TrackingPixels
        pixels={campaign.pixels}
        requireLegalAcceptance={campaign.requireLegalAcceptance}
        privacyAccepted={!campaign.requireLegalAcceptance}
      />
      {!isWidget && (
        <motion.div className="max-w-lg mx-auto px-4 pt-10 pb-6 text-center" {...fade}>
          {campaign.logoUrl && (
            <img src={campaign.logoUrl} alt="" className="h-10 mx-auto mb-5 object-contain" />
          )}
          {hero.kind === 'image' && (
            <div className="mb-6">
              <HeroMediaBlock hero={hero} />
            </div>
          )}
          <p className="text-xs font-medium uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--c-primary)' }}>
            Giveaway
          </p>
          <h1
            className="text-3xl md:text-4xl leading-tight font-semibold mb-3"
            style={{ fontFamily: 'var(--c-heading, inherit)' }}
          >
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--c-muted)' }}>
              {campaign.description}
            </p>
          )}
          {(hero.kind === 'youtube' || hero.kind === 'vimeo' || hero.kind === 'video') && (
            <div className="mt-5">
              <HeroMediaBlock hero={hero} />
            </div>
          )}
          <PrizeList prizes={prizes} />
          <div className="flex items-center justify-center gap-5 mt-5 text-sm" style={{ color: 'var(--c-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {formatNumber(Number(campaign.totalEntries) || 0)} entries
            </span>
            {campaign.endDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Ends {formatDate(campaign.endDate)}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {isWidget && (
        <motion.div className="text-center mb-4" {...fade}>
          {campaign.logoUrl && <img src={campaign.logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />}
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>{campaign.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>
            {formatNumber(campaign.totalEntries || 0)} entries
          </p>
        </motion.div>
      )}

      <motion.div className={cn(isWidget ? '' : 'max-w-lg mx-auto px-4 pb-16')} {...fade}>
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
      </motion.div>

      <LegalBlock campaign={campaign} />
    </CampaignThemeRoot>
  );

  if (!framed) return inner;

  if (displayMode === 'POPUP') {
    return (
      <motion.div
        className="min-h-full bg-black/70 flex items-center justify-center p-4"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="w-full max-w-lg max-h-[90%] overflow-auto rounded-2xl shadow-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          {inner}
        </motion.div>
      </motion.div>
    );
  }

  if (displayMode === 'BANNER') {
    const bottom = campaign.bannerPosition === 'bottom';
    return (
      <div className="min-h-full bg-zinc-800 relative">
        <motion.div
          className={cn('absolute left-0 right-0 max-h-[70%] overflow-auto shadow-xl', bottom ? 'bottom-0' : 'top-0')}
          initial={reduceMotion ? false : { y: bottom ? 16 : -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          {inner}
        </motion.div>
      </div>
    );
  }

  if (displayMode === 'SLIDE_IN') {
    return (
      <div className="min-h-full bg-zinc-800 relative overflow-hidden">
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-auto shadow-2xl"
          initial={reduceMotion ? false : { x: 28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          {inner}
        </motion.div>
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
      <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
        Sample referral link: {campaign.slug ? `/c/${campaign.slug}?ref=PREVIEW` : '/c/your-campaign?ref=PREVIEW'}
      </p>
      <PreviewSpinWheel campaign={campaign} size={200} caption="Participants can spin after they enter." />
    </div>
  );
}

export function PreviewReturningState({ campaign }: { campaign: any }) {
  return (
    <div className="space-y-4" data-testid="preview-returning">
      <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--c-heading)' }}>Welcome back</h2>
      <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
        Preview of a returning participant. Bonus actions stay available; required actions look completed.
      </p>
      {(campaign.entryActions || []).map((action: any, index: number) => (
        <div
          key={action.id || index}
          className="py-2.5 flex justify-between border-b text-sm"
          style={{ borderColor: 'color-mix(in srgb, var(--c-muted) 20%, transparent)' }}
        >
          <span>{action.title}</span>
          <span style={{ color: index === 0 ? 'var(--c-accent)' : 'var(--c-muted)' }}>
            {index === 0 ? 'Done' : `+${action.points}`}
          </span>
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
        <input disabled placeholder="Your email address" className="giveaway-field giveaway-field--icon" />
      </div>
      {campaign.requireName && (
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-muted)' }} />
          <input disabled placeholder="Your name" className="giveaway-field giveaway-field--icon" />
        </div>
      )}
      {campaign.requirePhone && (
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-muted)' }} />
          <input disabled placeholder="Phone (e.g. 03031234567)" className="giveaway-field giveaway-field--icon" />
        </div>
      )}
      <CustomFieldsForm fields={visibleCustomFields(campaign.customFormFields, campaign.requirePhone)} values={{}} onChange={() => undefined} disabled />
      <ConsentFields campaign={campaign} consent={{}} onChange={() => undefined} disabled />
      <button type="button" className="giveaway-btn">
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
