import { DEFAULT_CAMPAIGN_THEME } from '../../../campaign/theme';
import type { EntryAction } from '../../../components/CampaignBuilder';
import type { CustomFormFieldDraft } from '../../../components/CampaignBuilder/CustomFormBuilder';
import { toDateTimeLocal } from '../detail/constants';

export const BUILDER_STEPS = [
  { id: 'start', label: 'Start' },
  { id: 'basics', label: 'Basics' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'form', label: 'Entry Form' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'actions', label: 'Actions' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'legal', label: 'Rules' },
  { id: 'design', label: 'Design' },
  { id: 'display', label: 'Display' },
  { id: 'review', label: 'Review' },
] as const;

export interface BuilderPrize {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'PHYSICAL' | 'DIGITAL' | 'DISCOUNT' | 'EXPERIENCE';
  value?: number | string;
  image?: string;
  persisted?: boolean;
}

export interface BuilderState {
  step: number;
  stepId?: string;
  campaignId?: string;
  slug?: string;
  status?: string;
  templateId?: string;
  title: string;
  description: string;
  featuredImage: string;
  featuredVideo: string;
  startDate: string;
  endDate: string;
  timezone: string;
  launchMode: 'immediate' | 'scheduled';
  requireName: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  enableCaptcha: boolean;
  maxEntriesPerUser: string;
  restrictByLocation: boolean;
  allowedCountries: string;
  enableReferrals: boolean;
  referralBonusPoints: number;
  showLeaderboard: boolean;
  requireLegalAcceptance: boolean;
  businessEmailOnly: boolean;
  allowPrefill: boolean;
  facebookPixelId: string;
  googleAdsId: string;
  twitterPixelId: string;
  enableSpinWheel: boolean;
  spinsPerDay: number;
  displayMode: string;
  popupTrigger?: string;
  popupDelay?: number;
  popupScrollPercent?: number;
  bannerPosition?: string;
  slideInPosition?: string;
  showOnMobile: boolean;
  embedFrequencyHours?: number;
  theme: Record<string, any>;
  themePresetId?: string | null;
  customCss: string;
  logoUrl: string;
  backgroundImageUrl: string;
  fontFamily: string;
  officialRules: string;
  termsConditions: string;
  privacyPolicy: string;
  prizes: BuilderPrize[];
  actions: EntryAction[];
  formFields: CustomFormFieldDraft[];
}

export function emptyBuilderState(): BuilderState {
  return {
    step: 0,
    stepId: 'start',
    title: '',
    description: '',
    featuredImage: '',
    featuredVideo: '',
    startDate: '',
    endDate: '',
    timezone: 'UTC',
    launchMode: 'immediate',
    requireName: true,
    requireEmail: true,
    requirePhone: false,
    enableCaptcha: false,
    maxEntriesPerUser: '',
    restrictByLocation: false,
    allowedCountries: '',
    enableReferrals: true,
    referralBonusPoints: 5,
    showLeaderboard: true,
    requireLegalAcceptance: false,
    businessEmailOnly: false,
    allowPrefill: true,
    facebookPixelId: '',
    googleAdsId: '',
    twitterPixelId: '',
    enableSpinWheel: false,
    spinsPerDay: 1,
    displayMode: 'INLINE',
    popupTrigger: 'immediate',
    popupDelay: 5,
    popupScrollPercent: 50,
    bannerPosition: 'top',
    slideInPosition: 'right',
    showOnMobile: true,
    embedFrequencyHours: 24,
    theme: { ...DEFAULT_CAMPAIGN_THEME },
    customCss: '',
    logoUrl: '',
    backgroundImageUrl: '',
    fontFamily: 'Inter',
    officialRules: '',
    termsConditions: '',
    privacyPolicy: '',
    prizes: [],
    actions: [],
    formFields: [],
  };
}

function resolveStepIndex(overlay: any) {
  if (overlay?.stepId) {
    const idx = BUILDER_STEPS.findIndex((item) => item.id === overlay.stepId);
    if (idx >= 0) return idx;
  }
  return typeof overlay?.step === 'number' ? overlay.step : 1;
}

/** Draft autosave can persist empty arrays before prizes/actions exist. Empty overlay must not wipe server collections. */
export function mergeBuilderCollection<T extends { id?: string }>(overlay: T[] | undefined, server: T[]): T[] {
  if (!Array.isArray(overlay) || overlay.length === 0) return Array.isArray(server) ? server : [];
  if (!Array.isArray(server) || server.length === 0) return overlay;
  const persisted = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (overlay.some((item) => Boolean(item.id && persisted.test(item.id)))) return overlay;
  return server;
}

export function campaignToBuilderState(data: any, draft?: any): BuilderState {
  const base = emptyBuilderState();
  const overlay = draft && typeof draft === 'object' ? draft : {};
  return {
    ...base,
    ...overlay,
    campaignId: data.id,
    slug: data.slug,
    status: data.status,
    title: overlay.title ?? data.title ?? '',
    description: overlay.description ?? data.description ?? '',
    featuredImage: overlay.featuredImage ?? data.featuredImage ?? '',
    featuredVideo: overlay.featuredVideo ?? data.featuredVideo ?? '',
    startDate: overlay.startDate ?? toDateTimeLocal(data.startDate),
    endDate: overlay.endDate ?? toDateTimeLocal(data.endDate),
    timezone: overlay.timezone ?? data.timezone ?? 'UTC',
    requireName: overlay.requireName ?? Boolean(data.requireName),
    requireEmail: overlay.requireEmail ?? Boolean(data.requireEmail),
    requirePhone: overlay.requirePhone ?? Boolean(data.requirePhone),
    enableCaptcha: overlay.enableCaptcha ?? Boolean(data.enableCaptcha),
    maxEntriesPerUser: overlay.maxEntriesPerUser ?? (data.maxEntriesPerUser ? String(data.maxEntriesPerUser) : ''),
    restrictByLocation: overlay.restrictByLocation ?? Boolean(data.restrictByLocation),
    allowedCountries: overlay.allowedCountries ?? (Array.isArray(data.allowedCountries) ? data.allowedCountries.join(',') : ''),
    enableReferrals: overlay.enableReferrals ?? Boolean(data.enableReferrals),
    referralBonusPoints: overlay.referralBonusPoints ?? data.referralBonusPoints ?? 5,
    showLeaderboard: overlay.showLeaderboard ?? data.showLeaderboard !== false,
    requireLegalAcceptance: overlay.requireLegalAcceptance ?? Boolean(data.requireLegalAcceptance),
    businessEmailOnly: overlay.businessEmailOnly ?? Boolean(data.businessEmailOnly),
    allowPrefill: overlay.allowPrefill ?? data.allowPrefill !== false,
    facebookPixelId: overlay.facebookPixelId ?? data.facebookPixelId ?? '',
    googleAdsId: overlay.googleAdsId ?? data.googleAdsId ?? '',
    twitterPixelId: overlay.twitterPixelId ?? data.twitterPixelId ?? '',
    enableSpinWheel: overlay.enableSpinWheel ?? Boolean(data.enableSpinWheel),
    spinsPerDay: overlay.spinsPerDay ?? data.spinsPerDay ?? 1,
    displayMode: overlay.displayMode ?? data.displayMode ?? 'INLINE',
    popupTrigger: overlay.popupTrigger ?? data.popupTrigger ?? 'immediate',
    popupDelay: overlay.popupDelay ?? data.popupDelay ?? 5,
    popupScrollPercent: overlay.popupScrollPercent ?? data.popupScrollPercent ?? 50,
    bannerPosition: overlay.bannerPosition ?? data.bannerPosition ?? 'top',
    slideInPosition: overlay.slideInPosition ?? data.slideInPosition ?? 'right',
    showOnMobile: overlay.showOnMobile ?? data.showOnMobile !== false,
    embedFrequencyHours: overlay.embedFrequencyHours ?? data.embedFrequencyHours ?? 24,
    theme: { ...DEFAULT_CAMPAIGN_THEME, ...(data.theme || {}), ...(overlay.theme || {}) },
    customCss: overlay.customCss ?? data.customCss ?? '',
    logoUrl: overlay.logoUrl ?? data.logoUrl ?? '',
    backgroundImageUrl: overlay.backgroundImageUrl ?? data.backgroundImageUrl ?? '',
    fontFamily: overlay.fontFamily ?? data.fontFamily ?? 'Inter',
    officialRules: overlay.officialRules ?? data.officialRules ?? '',
    termsConditions: overlay.termsConditions ?? data.termsConditions ?? '',
    privacyPolicy: overlay.privacyPolicy ?? data.privacyPolicy ?? '',
    prizes: mergeBuilderCollection(
      overlay.prizes,
      (data.prizes || []).map((prize: any) => ({ ...prize, persisted: true }))
    ),
    actions: mergeBuilderCollection(
      overlay.actions,
      (data.entryActions || []).map((action: any) => ({
        id: action.id,
        type: action.type,
        title: action.title,
        description: action.description || '',
        points: action.points,
        required: action.required,
        order: action.order || 0,
        dailyLimit: action.dailyLimit ?? null,
        config: action.config || {},
        completionKey: action.completionKey,
        completionSecret: action.completionSecret,
      }))
    ),
    formFields: mergeBuilderCollection(
      overlay.formFields,
      (data.customFormFields || []).map((field: any) => ({
        id: field.id,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options : [],
        order: field.order || 0,
        persisted: true,
      }))
    ),
    step: resolveStepIndex(overlay),
    stepId: overlay.stepId || BUILDER_STEPS[resolveStepIndex(overlay)]?.id,
  };
}

export function builderCampaignPayload(state: BuilderState) {
  const url = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^https?:\/\//i.test(trimmed)) return null;
    return trimmed;
  };
  return {
    title: state.title,
    description: state.description || null,
    startDate: state.startDate ? new Date(state.startDate).toISOString() : null,
    endDate: state.endDate ? new Date(state.endDate).toISOString() : null,
    timezone: state.timezone,
    requireName: state.requireName,
    requireEmail: state.requireEmail,
    requirePhone: state.requirePhone,
    enableCaptcha: state.enableCaptcha,
    maxEntriesPerUser: state.maxEntriesPerUser ? Number(state.maxEntriesPerUser) : null,
    restrictByLocation: state.restrictByLocation,
    allowedCountries: state.allowedCountries
      ? state.allowedCountries.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    enableReferrals: state.enableReferrals,
    referralBonusPoints: Number(state.referralBonusPoints) || 0,
    showLeaderboard: state.showLeaderboard,
    requireLegalAcceptance: state.requireLegalAcceptance,
    businessEmailOnly: state.businessEmailOnly,
    allowPrefill: state.allowPrefill,
    facebookPixelId: state.facebookPixelId.trim() || null,
    googleAdsId: state.googleAdsId.trim() || null,
    twitterPixelId: state.twitterPixelId.trim() || null,
    enableSpinWheel: state.enableSpinWheel,
    spinsPerDay: Number(state.spinsPerDay) || 1,
    displayMode: state.displayMode,
    popupTrigger: state.popupTrigger,
    popupDelay: state.popupDelay,
    popupScrollPercent: state.popupScrollPercent,
    bannerPosition: state.bannerPosition,
    slideInPosition: state.slideInPosition,
    showOnMobile: state.showOnMobile,
    embedFrequencyHours: state.embedFrequencyHours,
    theme: state.theme,
    customCss: state.customCss || null,
    logoUrl: url(state.logoUrl),
    backgroundImageUrl: url(state.backgroundImageUrl),
    fontFamily: state.fontFamily || state.theme.bodyFont || 'Inter',
    featuredImage: url(state.featuredImage),
    featuredVideo: url(state.featuredVideo),
    officialRules: state.officialRules || null,
    termsConditions: state.termsConditions || null,
    privacyPolicy: state.privacyPolicy || null,
  };
}

export function previewCampaignFromState(state: BuilderState) {
  return {
    ...builderCampaignPayload(state),
    id: state.campaignId,
    slug: state.slug,
    prizes: state.prizes,
    entryActions: state.actions,
    customFormFields: state.formFields,
    totalEntries: 0,
    theme: state.theme,
    showLeaderboard: state.showLeaderboard,
    requireLegalAcceptance: state.requireLegalAcceptance,
    requirePhone: state.requirePhone,
    pixels: [
      state.facebookPixelId.trim() ? { type: 'FACEBOOK_PIXEL', pixelId: state.facebookPixelId.trim() } : null,
      state.googleAdsId.trim() ? { type: 'GOOGLE_ADS', pixelId: state.googleAdsId.trim() } : null,
      state.twitterPixelId.trim() ? { type: 'TWITTER_PIXEL', pixelId: state.twitterPixelId.trim() } : null,
    ].filter((item): item is { type: string; pixelId: string } => Boolean(item)),
  };
}
