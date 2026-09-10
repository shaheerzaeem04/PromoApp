export const TRIGGER_OPTIONS = [
  { value: 'PARTICIPANT_CREATED', label: 'Participant created', event: 'participant.created' },
  { value: 'NEWSLETTER_COMPLETED', label: 'Entry / newsletter completed', event: 'entry.completed' },
  { value: 'WINNER_SELECTED', label: 'Winner selected', event: 'winner.selected' },
  { value: 'CAMPAIGN_STARTED', label: 'Campaign started', event: 'campaign.started' },
  { value: 'CAMPAIGN_ENDED', label: 'Campaign ended', event: 'campaign.ended' },
];

export const AUTOMATION_EVENTS = [
  { value: 'participant.created', label: 'participant.created' },
  { value: 'entry.completed', label: 'entry.completed' },
  { value: 'winner.selected', label: 'winner.selected' },
  { value: 'campaign.started', label: 'campaign.started' },
  { value: 'campaign.ended', label: 'campaign.ended' },
];

export const SYSTEM_FIELDS = [
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'points', label: 'Points' },
  { value: 'referralSource', label: 'Referral source' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'createdDate', label: 'Created date' },
];

export function triggerLabel(trigger: string) {
  return TRIGGER_OPTIONS.find((item) => item.value === trigger)?.label || trigger;
}

export function healthVariant(health?: string): 'success' | 'danger' | 'warning' | 'default' {
  if (health === 'CONNECTED') return 'success';
  if (health === 'ERROR') return 'danger';
  if (health === 'NEEDS_REAUTH') return 'warning';
  return 'default';
}

export function fieldLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
