import { SpinWheel } from '../components/SpinWheel';

export const PREVIEW_SPIN_SEGMENTS = [
  { id: 'preview-1', label: '+5 Entries', color: '#14b8a6', rewardType: 'BONUS_ENTRIES' },
  { id: 'preview-2', label: '+10 Entries', color: '#0d9488', rewardType: 'BONUS_ENTRIES' },
  { id: 'preview-3', label: '+20 Entries', color: '#0891b2', rewardType: 'BONUS_ENTRIES' },
  { id: 'preview-4', label: '10% Off', color: '#f59e0b', rewardType: 'DISCOUNT_CODE' },
  { id: 'preview-5', label: '25% Off', color: '#ef4444', rewardType: 'DISCOUNT_CODE' },
  { id: 'preview-6', label: 'Try Again', color: '#71717a', rewardType: 'NO_WIN' },
];

export function spinSegmentsForPreview(campaign: any) {
  const incoming = Array.isArray(campaign?.spinWheelSegments) ? campaign.spinWheelSegments : [];
  if (incoming.length > 0) {
    return incoming.map((segment: any, index: number) => ({
      id: segment.id || `preview-${index}`,
      label: segment.label,
      color: segment.color || '#14b8a6',
      rewardType: segment.rewardType || 'BONUS_ENTRIES',
    }));
  }
  return PREVIEW_SPIN_SEGMENTS;
}

export function SpinLockedTeaser({ caption }: { caption?: string }) {
  return (
    <p
      data-testid="preview-spin-wheel"
      className="text-sm text-center py-2"
      style={{ color: 'var(--c-muted)' }}
    >
      {caption || 'Enter the giveaway to unlock your spin.'}
    </p>
  );
}

export function PreviewSpinWheel({
  campaign,
  size = 220,
  caption,
  interactive = false,
  locked = false,
}: {
  campaign: any;
  size?: number;
  caption?: string;
  interactive?: boolean;
  locked?: boolean;
}) {
  if (!campaign?.enableSpinWheel) return null;
  if (locked) {
    return <SpinLockedTeaser caption={caption} />;
  }
  const segments = spinSegmentsForPreview(campaign);
  const spins = Number(campaign.spinsPerDay) || 1;

  return (
    <div
      data-testid="preview-spin-wheel"
      className="py-4 text-center"
    >
      <p className="text-sm font-semibold mb-1">Your spin</p>
      <p className="text-xs mb-3" style={{ color: 'var(--c-muted)' }}>
        {caption || `${spins} spin${spins === 1 ? '' : 's'} per day after entering`}
      </p>
      <SpinWheel
        segments={segments}
        spinsRemaining={spins}
        size={size}
        hideControls={!interactive}
        disabled={!interactive}
        onSpin={async () => {
          const segment = segments[Math.floor(Math.random() * segments.length)];
          return {
            success: segment.rewardType !== 'NO_WIN',
            segment,
            message: segment.label,
            spinsRemaining: Math.max(0, spins - 1),
          };
        }}
      />
    </div>
  );
}
