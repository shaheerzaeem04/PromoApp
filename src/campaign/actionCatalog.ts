export type VerificationMode = 'verified_internal' | 'honor_system' | 'recorded';

export interface ActionDefinition {
  type: string;
  group: 'LEAD_CAPTURE' | 'SOCIAL' | 'WEBSITE_ENGAGEMENT' | 'QUESTIONS' | 'REFERRAL' | 'BONUS' | 'CODES' | 'UGC' | 'CUSTOM';
  label: string;
  verification: VerificationMode;
  publicHint: string;
}

export const ACTION_GROUPS: { id: ActionDefinition['group']; label: string }[] = [
  { id: 'LEAD_CAPTURE', label: 'Lead capture' },
  { id: 'SOCIAL', label: 'Social' },
  { id: 'WEBSITE_ENGAGEMENT', label: 'Website' },
  { id: 'QUESTIONS', label: 'Questions' },
  { id: 'REFERRAL', label: 'Referral' },
  { id: 'BONUS', label: 'Bonus' },
  { id: 'CODES', label: 'Codes' },
  { id: 'UGC', label: 'Uploads' },
  { id: 'CUSTOM', label: 'Custom' },
];

export const ACTION_DEFINITIONS: ActionDefinition[] = [
  { type: 'NEWSLETTER', group: 'LEAD_CAPTURE', label: 'Subscribe to newsletter', verification: 'verified_internal', publicHint: 'Complete this action to confirm you joined the newsletter. Entering the giveaway does not complete it automatically.' },
  { type: 'VISIT_URL', group: 'WEBSITE_ENGAGEMENT', label: 'Visit URL', verification: 'verified_internal', publicHint: 'We record that you opened the link.' },
  { type: 'BLOG_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit blog post', verification: 'verified_internal', publicHint: 'We record that you opened the article.' },
  { type: 'APP_DOWNLOAD', group: 'WEBSITE_ENGAGEMENT', label: 'Get the app', verification: 'honor_system', publicHint: 'You confirm this yourself. We cannot verify app installs.' },
  { type: 'FACEBOOK_LIKE', group: 'SOCIAL', label: 'Like on Facebook', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Facebook.' },
  { type: 'FACEBOOK_SHARE', group: 'SOCIAL', label: 'Share on Facebook', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Facebook.' },
  { type: 'TWITTER_FOLLOW', group: 'SOCIAL', label: 'Follow on X', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with X.' },
  { type: 'TWITTER_RETWEET', group: 'SOCIAL', label: 'Repost on X', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with X.' },
  { type: 'TWITTER_TWEET', group: 'SOCIAL', label: 'Post on X', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with X.' },
  { type: 'INSTAGRAM_FOLLOW', group: 'SOCIAL', label: 'Follow on Instagram', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Instagram.' },
  { type: 'INSTAGRAM_LIKE', group: 'SOCIAL', label: 'Like on Instagram', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Instagram.' },
  { type: 'TIKTOK_FOLLOW', group: 'SOCIAL', label: 'Follow on TikTok', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with TikTok.' },
  { type: 'TIKTOK_LIKE', group: 'SOCIAL', label: 'Like on TikTok', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with TikTok.' },
  { type: 'YOUTUBE_SUBSCRIBE', group: 'SOCIAL', label: 'Subscribe on YouTube', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with YouTube.' },
  { type: 'YOUTUBE_WATCH', group: 'SOCIAL', label: 'Watch on YouTube', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with YouTube.' },
  { type: 'REDDIT_VISIT', group: 'SOCIAL', label: 'Visit on Reddit', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Reddit.' },
  { type: 'PINTEREST_PIN', group: 'SOCIAL', label: 'Save on Pinterest', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Pinterest.' },
  { type: 'LINKEDIN_SHARE', group: 'SOCIAL', label: 'Share on LinkedIn', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with LinkedIn.' },
  { type: 'PODCAST_LISTEN', group: 'SOCIAL', label: 'Listen to podcast', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with the host.' },
  { type: 'QUESTION', group: 'QUESTIONS', label: 'Answer a question', verification: 'recorded', publicHint: 'Your answer is saved. Free-text answers are not marked verified unless this is a quiz.' },
  { type: 'VIRAL_SHARE', group: 'REFERRAL', label: 'Refer friends', verification: 'verified_internal', publicHint: 'Points are awarded when someone else enters with your link — not for clicking share.' },
  { type: 'BONUS_ENTRY', group: 'BONUS', label: 'Daily bonus', verification: 'verified_internal', publicHint: 'Claimed once per campaign day.' },
  { type: 'SECRET_CODE', group: 'CODES', label: 'Secret code', verification: 'verified_internal', publicHint: 'Verified when a valid campaign code is redeemed.' },
  { type: 'COUPON_CODE', group: 'CODES', label: 'Coupon / promo confirm', verification: 'honor_system', publicHint: 'User-confirmed. We do not verify retailer coupons.' },
  { type: 'LOYALTY_BONUS', group: 'BONUS', label: 'Loyalty bonus', verification: 'honor_system', publicHint: 'User-confirmed loyalty bonus.' },
  { type: 'PHOTO_UPLOAD', group: 'UGC', label: 'Upload a photo', verification: 'verified_internal', publicHint: 'Verified after the server accepts the image.' },
  { type: 'DOCUMENT_UPLOAD', group: 'UGC', label: 'Upload a PDF', verification: 'verified_internal', publicHint: 'Verified after the server accepts the PDF.' },
  { type: 'CUSTOM_ACTION', group: 'CUSTOM', label: 'Custom action', verification: 'honor_system', publicHint: 'User-confirmed unless completed by an inbound webhook.' },
  { type: 'TELEGRAM_JOIN', group: 'SOCIAL', label: 'Join Telegram', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Telegram.' },
  { type: 'WHATSAPP_VISIT', group: 'SOCIAL', label: 'Open WhatsApp', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with WhatsApp.' },
  { type: 'SPOTIFY_FOLLOW', group: 'SOCIAL', label: 'Follow on Spotify', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Spotify.' },
  { type: 'SPOTIFY_LISTEN', group: 'SOCIAL', label: 'Listen on Spotify', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Spotify.' },
  { type: 'APPLE_MUSIC_LISTEN', group: 'SOCIAL', label: 'Listen on Apple Music', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Apple.' },
  { type: 'TWITCH_FOLLOW', group: 'SOCIAL', label: 'Follow on Twitch', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Twitch.' },
  { type: 'TWITCH_WATCH', group: 'SOCIAL', label: 'Watch on Twitch', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Twitch.' },
  { type: 'APP_STORE_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit App Store', verification: 'honor_system', publicHint: 'User-confirmed store visit.' },
  { type: 'GOOGLE_PLAY_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit Google Play', verification: 'honor_system', publicHint: 'User-confirmed store visit.' },
  { type: 'DISCORD_JOIN', group: 'SOCIAL', label: 'Join Discord', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Discord.' },
  { type: 'FACEBOOK_GROUP_VISIT', group: 'SOCIAL', label: 'Visit Facebook group', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Facebook.' },
  { type: 'INSTAGRAM_PROFILE_VISIT', group: 'SOCIAL', label: 'Visit Instagram profile', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Instagram.' },
  { type: 'YOUTUBE_CHANNEL_VISIT', group: 'SOCIAL', label: 'Visit YouTube channel', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with YouTube.' },
  { type: 'PINTEREST_FOLLOW', group: 'SOCIAL', label: 'Follow on Pinterest', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Pinterest.' },
  { type: 'LINKEDIN_FOLLOW', group: 'SOCIAL', label: 'Follow on LinkedIn', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with LinkedIn.' },
  { type: 'REDDIT_JOIN', group: 'SOCIAL', label: 'Join subreddit', verification: 'honor_system', publicHint: 'User-confirmed. Not verified with Reddit.' },
  { type: 'REVIEW_SITE_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit review page', verification: 'honor_system', publicHint: 'User-confirmed. We do not verify that a review was posted.' },
  { type: 'BOOK_APPOINTMENT', group: 'WEBSITE_ENGAGEMENT', label: 'Book an appointment', verification: 'honor_system', publicHint: 'User-confirmed. We do not verify bookings.' },
  { type: 'PRODUCT_PAGE_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit product page', verification: 'verified_internal', publicHint: 'We record that you opened the product link.' },
  { type: 'STORE_VISIT', group: 'WEBSITE_ENGAGEMENT', label: 'Visit store', verification: 'verified_internal', publicHint: 'We record that you opened the store link.' },
  { type: 'DOWNLOAD_RESOURCE', group: 'WEBSITE_ENGAGEMENT', label: 'Download a resource', verification: 'honor_system', publicHint: 'User-confirmed download.' },
  { type: 'WATCH_VIDEO', group: 'WEBSITE_ENGAGEMENT', label: 'Watch a video', verification: 'honor_system', publicHint: 'User-confirmed. Playback is not verified.' },
  { type: 'LISTEN_AUDIO', group: 'WEBSITE_ENGAGEMENT', label: 'Listen to audio', verification: 'honor_system', publicHint: 'User-confirmed. Playback is not verified.' },
  { type: 'JOIN_COMMUNITY', group: 'SOCIAL', label: 'Join a community', verification: 'honor_system', publicHint: 'User-confirmed community join.' },
  { type: 'WEBHOOK_COMPLETE', group: 'CUSTOM', label: 'External webhook completion', verification: 'verified_internal', publicHint: 'Completed by a signed webhook from an external system — not by clicking here.' },
];

export function getActionDefinition(type: string) {
  return ACTION_DEFINITIONS.find((item) => item.type === type);
}

export function verificationLabelForMode(mode?: string) {
  if (mode === 'verified_internal' || mode === 'VERIFIED') return 'Verified internally';
  if (mode === 'recorded' || mode === 'RECORDED') return 'Recorded';
  return 'User-confirmed';
}

export function socialDestinationUrl(type: string, config: Record<string, any> = {}) {
  if (config.url) return config.url;
  if (config.channelUrl) return config.channelUrl;
  const username = String(config.username || '').replace(/^@/, '');
  if (!username) return undefined;
  if (type.startsWith('TWITTER')) return `https://x.com/${username}`;
  if (type.startsWith('INSTAGRAM')) return `https://instagram.com/${username}`;
  if (type.startsWith('TIKTOK')) return `https://www.tiktok.com/@${username}`;
  if (type.startsWith('FACEBOOK')) return `https://facebook.com/${username}`;
  return undefined;
}
