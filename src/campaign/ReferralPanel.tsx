import { ShareButtons } from '../components/giveaway/ShareButtons';

interface ReferralPanelProps {
  url: string;
  title: string;
  bonusPoints: number;
  referralsCount?: number;
  referralPoints?: number;
  compact?: boolean;
}

export function ReferralPanel({
  url,
  title,
  bonusPoints,
  referralsCount = 0,
  referralPoints = 0,
  compact,
}: ReferralPanelProps) {
  return (
    <div className={compact ? 'py-2' : 'py-1'}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-semibold">Invite friends</p>
        <p className="text-xs text-primary-400">+{bonusPoints} each</p>
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        Points are added when someone else enters with your link.
      </p>
      <p className="text-xs text-zinc-500 mb-2">{referralsCount} successful · {referralPoints} referral points</p>
      <input readOnly value={url} data-testid="referral-url" className="w-full mb-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-sm" />
      <ShareButtons url={url} title={title} compact={compact} />
    </div>
  );
}
