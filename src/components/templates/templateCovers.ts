import type { CatalogTemplate } from './templateMeta';

/** Bump this after replacing cover files so browsers fetch the new art. */
export const TEMPLATE_COVER_VERSION = '1';

export type CoverPalette = {
  from: string;
  to: string;
  accent: string;
};

export const COVER_PALETTES: Record<string, CoverPalette> = {
  blank: { from: '#3f3f46', to: '#18181b', accent: '#e4e4e7' },
  'ai-generated': { from: '#7c3aed', to: '#a21caf', accent: '#f5d0fe' },
  ai: { from: '#7c3aed', to: '#a21caf', accent: '#f5d0fe' },
  basic: { from: '#0d9488', to: '#065f46', accent: '#99f6e4' },
  instagram: { from: '#ec4899', to: '#fb923c', accent: '#ffe4e6' },
  facebook: { from: '#2563eb', to: '#1e3a8a', accent: '#bfdbfe' },
  youtube: { from: '#dc2626', to: '#7f1d1d', accent: '#fecaca' },
  'x-twitter': { from: '#e4e4e7', to: '#3f3f46', accent: '#fafafa' },
  x: { from: '#e4e4e7', to: '#3f3f46', accent: '#fafafa' },
  tiktok: { from: '#22d3ee', to: '#ec4899', accent: '#ffffff' },
  linkedin: { from: '#0284c7', to: '#1e3a8a', accent: '#bae6fd' },
  pinterest: { from: '#ef4444', to: '#9f1239', accent: '#fecdd3' },
  twitch: { from: '#a855f7', to: '#4c1d95', accent: '#e9d5ff' },
  discord: { from: '#6366f1', to: '#312e81', accent: '#c7d2fe' },
  'email-list': { from: '#3b82f6', to: '#0e7490', accent: '#bae6fd' },
  email: { from: '#3b82f6', to: '#0e7490', accent: '#bae6fd' },
  referral: { from: '#f59e0b', to: '#c2410c', accent: '#fde68a' },
  'photo-contest': { from: '#d946ef', to: '#6b21a8', accent: '#f5d0fe' },
  photo: { from: '#d946ef', to: '#6b21a8', accent: '#f5d0fe' },
  'video-contest': { from: '#f43f5e', to: '#991b1b', accent: '#fecdd3' },
  video: { from: '#f43f5e', to: '#991b1b', accent: '#fecdd3' },
  quiz: { from: '#10b981', to: '#115e59', accent: '#a7f3d0' },
  survey: { from: '#0ea5e9', to: '#3730a3', accent: '#c7d2fe' },
  'app-download': { from: '#84cc16', to: '#166534', accent: '#d9f99d' },
  app: { from: '#84cc16', to: '#166534', accent: '#d9f99d' },
  'product-launch': { from: '#6366f1', to: '#0891b2', accent: '#a5f3fc' },
  launch: { from: '#6366f1', to: '#0891b2', accent: '#a5f3fc' },
  holiday: { from: '#dc2626', to: '#15803d', accent: '#fde68a' },
  milestone: { from: '#eab308', to: '#92400e', accent: '#fef08a' },
  ugc: { from: '#ec4899', to: '#6d28d9', accent: '#fbcfe8' },
  vip: { from: '#fcd34d', to: '#a16207', accent: '#fffbeb' },
  newsletter: { from: '#60a5fa', to: '#4338ca', accent: '#c7d2fe' },
  'caption-contest': { from: '#fb923c', to: '#db2777', accent: '#ffedd5' },
  caption: { from: '#fb923c', to: '#db2777', accent: '#ffedd5' },
  snapchat: { from: '#facc15', to: '#a16207', accent: '#fef9c3' },
  'social-growth': { from: '#ec4899', to: '#be123c', accent: '#fecdd3' },
  social: { from: '#ec4899', to: '#be123c', accent: '#fecdd3' },
  'spin-to-win': { from: '#f59e0b', to: '#c2410c', accent: '#fde68a' },
  spin: { from: '#f59e0b', to: '#c2410c', accent: '#fde68a' },
  minimal: { from: '#a1a1aa', to: '#3f3f46', accent: '#f4f4f5' },
};

const FILE_BY_KEY: Record<string, string> = {
  blank: 'blank',
  'ai-generated': 'ai-generated',
  ai: 'ai-generated',
  basic: 'basic',
  instagram: 'instagram',
  facebook: 'facebook',
  youtube: 'youtube',
  'x-twitter': 'x-twitter',
  x: 'x-twitter',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  pinterest: 'pinterest',
  twitch: 'twitch',
  discord: 'discord',
  'email-list': 'email-list',
  email: 'email-list',
  referral: 'referral',
  'photo-contest': 'photo-contest',
  photo: 'photo-contest',
  'video-contest': 'video-contest',
  video: 'video-contest',
  quiz: 'quiz',
  survey: 'survey',
  'app-download': 'app-download',
  app: 'app-download',
  'product-launch': 'product-launch',
  launch: 'product-launch',
  holiday: 'holiday',
  milestone: 'milestone',
  ugc: 'ugc',
  vip: 'vip',
  newsletter: 'newsletter',
  'caption-contest': 'caption-contest',
  caption: 'caption-contest',
  snapchat: 'snapchat',
  'social-growth': 'social-growth',
  social: 'social-growth',
  'spin-to-win': 'spin-to-win',
  spin: 'spin-to-win',
  minimal: 'minimal',
};

export function isUsableCoverSrc(value?: string | null): boolean {
  if (!value) return false;
  if (value.startsWith('from-')) return false;
  return /^(https?:\/\/|\/|data:image\/)/i.test(value);
}

export function coverFileKey(template: CatalogTemplate): string {
  const slug = template.slug || '';
  const icon = template.iconKey || '';
  return FILE_BY_KEY[slug] || FILE_BY_KEY[icon] || 'basic';
}

export function coverPalette(template: CatalogTemplate): CoverPalette {
  const slug = template.slug || '';
  const icon = template.iconKey || '';
  return COVER_PALETTES[slug] || COVER_PALETTES[icon] || COVER_PALETTES.basic;
}

export function withCoverCache(src: string, reloadToken = 0): string {
  const join = src.includes('?') ? '&' : '?';
  const versioned = `${src}${join}v=${TEMPLATE_COVER_VERSION}`;
  return reloadToken ? `${versioned}&r=${reloadToken}` : versioned;
}

export function resolveTemplateCoverSrc(template: CatalogTemplate): string {
  if (isUsableCoverSrc(template.thumbnail)) return template.thumbnail as string;
  return `/templates/covers/${coverFileKey(template)}.svg`;
}
