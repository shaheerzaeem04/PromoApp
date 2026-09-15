import type { LucideIcon } from 'lucide-react';
import {
  Gift,
  Sparkles,
  Users,
  Mail,
  Snowflake,
  Zap,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Twitch,
  MessageCircle,
  Camera,
  Video,
  HelpCircle,
  ClipboardList,
  Smartphone,
  Rocket,
  Trophy,
  Crown,
  PenLine,
  Share2,
  Image,
  Disc3,
} from 'lucide-react';

export interface CatalogTemplate {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  longDescription?: string | null;
  category: string;
  badge?: string | null;
  thumbnail?: string | null;
  thumbnailGradient?: string | null;
  iconKey?: string | null;
  config: Record<string, any>;
  version?: number;
  sortOrder?: number;
  isPublic: boolean;
  isActive?: boolean;
  comingSoon?: boolean;
  isBlank?: boolean;
  tags?: string[];
  browseGroups?: string[];
  userId?: string | null;
  source?: 'system' | 'user';
}

export const BROWSE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'lead', label: 'Lead Generation' },
  { id: 'referral', label: 'Referral' },
  { id: 'contest', label: 'Contest' },
  { id: 'ugc', label: 'UGC' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'product', label: 'Product' },
  { id: 'community', label: 'Community' },
];

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  blank: Zap,
  ai: Sparkles,
  basic: Gift,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  x: Twitter,
  tiktok: Video,
  linkedin: Linkedin,
  pinterest: Image,
  twitch: Twitch,
  discord: MessageCircle,
  email: Mail,
  referral: Share2,
  photo: Camera,
  video: Video,
  quiz: HelpCircle,
  survey: ClipboardList,
  app: Smartphone,
  launch: Rocket,
  holiday: Snowflake,
  milestone: Trophy,
  ugc: Users,
  vip: Crown,
  newsletter: Mail,
  caption: PenLine,
  snapchat: Disc3,
  social: Users,
  spin: Sparkles,
  minimal: Zap,
  custom: Gift,
  general: Gift,
};

export function templateIcon(template: CatalogTemplate): LucideIcon {
  return TEMPLATE_ICONS[template.iconKey || ''] || TEMPLATE_ICONS[template.category] || Gift;
}

export function templateGradient(template: CatalogTemplate): string {
  return template.thumbnailGradient || 'from-zinc-600 to-zinc-800';
}

export function formatTagLabel(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function templateDisplayTags(template: CatalogTemplate, limit = 3) {
  const labels: string[] = [];
  const seen = new Set<string>();
  const push = (value?: string | null) => {
    const label = formatTagLabel((value || '').trim());
    const key = label.toLowerCase();
    if (!label || seen.has(key)) return;
    seen.add(key);
    labels.push(label);
  };

  push(template.badge);
  push(template.category);
  for (const tag of template.tags || []) push(tag);
  return labels.slice(0, limit);
}
