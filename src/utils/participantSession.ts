export interface StoredParticipantSession {
  token: string;
  participantId: string;
  campaignId: string;
}

function storageKey(slug: string): string {
  return `promo_session_${slug}`;
}

export function saveParticipantSession(slug: string, session: StoredParticipantSession): void {
  localStorage.setItem(storageKey(slug), JSON.stringify(session));
  localStorage.removeItem(`promo_${slug}_email`);
}

export function loadParticipantSession(slug: string): StoredParticipantSession | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredParticipantSession>;
    if (!parsed.token || !parsed.participantId || !parsed.campaignId) {
      return null;
    }
    return {
      token: parsed.token,
      participantId: parsed.participantId,
      campaignId: parsed.campaignId,
    };
  } catch {
    return null;
  }
}

export function clearParticipantSession(slug: string): void {
  localStorage.removeItem(storageKey(slug));
  localStorage.removeItem(`promo_${slug}_email`);
}

export function participantSessionHeaders(token?: string): Record<string, string> {
  return token ? { 'X-Participant-Session': token } : {};
}
