interface ProgressPanelProps {
  participant: any;
  campaign: any;
}

export function ProgressPanel({ participant, campaign }: ProgressPanelProps) {
  const actions = campaign.entryActions || [];
  const completed = new Set(participant.completedActions || []);
  const remaining = actions.filter((action: any) => action.type !== 'VIRAL_SHARE' && !completed.has(action.id));
  const required = remaining.filter((action: any) => action.required);
  const daily = (participant.dailyStatus || []).filter((item: any) => item.remainingToday > 0);

  return (
    <div className="text-sm space-y-1" style={{ color: 'var(--c-muted)' }}>
      <p className="font-medium text-zinc-100">Your progress</p>
      <p data-testid="participant-progress">{participant.totalPoints || 0} points · {participant.entriesCount || completed.size} completions</p>
      <p>{completed.size} completed · {remaining.length} remaining</p>
      {required.length > 0 && <p className="text-amber-400">{required.length} required action{required.length === 1 ? '' : 's'} left</p>}
      {daily.length > 0 && <p>{daily.length} daily action{daily.length === 1 ? '' : 's'} available now</p>}
      <p>Referral points: {participant.referralPoints || 0} · successful referrals: {participant.referralsCount || 0}</p>
      {participant.secretCodeCompleted && <p>Secret code redeemed</p>}
      {participant.consent?.acceptedAt && <p>Legal acceptance recorded</p>}
    </div>
  );
}
