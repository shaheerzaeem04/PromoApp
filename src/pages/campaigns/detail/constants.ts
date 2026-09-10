export const entryActionTypes = [
  { value: 'NEWSLETTER', label: 'Subscribe to Newsletter', icon: '📧' },
  { value: 'VIRAL_SHARE', label: 'Viral Share (Referral)', icon: '🔗' },
  { value: 'VISIT_URL', label: 'Visit URL', icon: '🌐' },
  { value: 'TWITTER_FOLLOW', label: 'Follow on Twitter/X', icon: '🐦' },
  { value: 'INSTAGRAM_FOLLOW', label: 'Follow on Instagram', icon: '📸' },
  { value: 'TIKTOK_FOLLOW', label: 'Follow on TikTok', icon: '🎵' },
  { value: 'YOUTUBE_SUBSCRIBE', label: 'Subscribe on YouTube', icon: '📺' },
  { value: 'FACEBOOK_LIKE', label: 'Like on Facebook', icon: '👍' },
  { value: 'QUESTION', label: 'Answer a Question', icon: '❓' },
  { value: 'SECRET_CODE', label: 'Enter Secret Code', icon: '🔐' },
  { value: 'BONUS_ENTRY', label: 'Daily Bonus Entry', icon: '🎁' },
  { value: 'BLOG_VISIT', label: 'Visit Blog Post', icon: '📝' },
  { value: 'CUSTOM_ACTION', label: 'Custom Action', icon: '⚡' },
];

export const prizeTypes = [
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'EXPERIENCE', label: 'Experience' },
];

export const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  SCHEDULED: 'info',
  PAUSED: 'warning',
  ENDED: 'danger',
};

export const rewardTypes = [
  { value: 'BONUS_ENTRIES', label: 'Bonus Entries', icon: '🎯' },
  { value: 'DISCOUNT_CODE', label: 'Discount Code', icon: '🏷️' },
  { value: 'PHYSICAL_PRIZE', label: 'Physical Prize', icon: '📦' },
  { value: 'DIGITAL_PRIZE', label: 'Digital Prize', icon: '💻' },
  { value: 'NO_WIN', label: 'No Win (Try Again)', icon: '😢' },
];

export const segmentColors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#71717a',
];

export function apiErrorMessage(error: any, fallback = 'Request failed') {
  const payload = error?.response?.data?.error;
  const code = payload?.code;
  const details = payload?.details;
  if (code === 'LIMIT_REACHED') {
    return `Plan limit reached for ${details?.feature || 'this feature'}. Upgrade to continue.`;
  }
  if (code === 'FEATURE_DISABLED') {
    return 'This feature is not included in the current plan. Upgrade to unlock it.';
  }
  const fieldErrors = payload?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const parts = Object.entries(fieldErrors).flatMap(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [String(messages)];
      return list.map((msg) => (field ? `${field}: ${msg}` : String(msg)));
    });
    if (parts.length) return parts.slice(0, 3).join(' · ');
  }
  return payload?.message || fallback;
}

export function toDateTimeLocal(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function verificationLabel(entry: { verified?: boolean; invalidated?: boolean; metadata?: any }) {
  if (entry.invalidated) return 'Invalidated';
  const status = entry.metadata?.verificationStatus;
  if (status === 'HONOR_SYSTEM') return 'Honor system';
  if (status === 'FAILED') return 'Failed';
  if (status === 'RECORDED') return 'Recorded';
  if (entry.verified || status === 'VERIFIED') return 'Verified';
  return 'Unverified';
}
