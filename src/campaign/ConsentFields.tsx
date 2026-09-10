interface ConsentFieldsProps {
  campaign: any;
  consent: { terms?: boolean; privacy?: boolean; rules?: boolean };
  onChange: (consent: { terms?: boolean; privacy?: boolean; rules?: boolean }) => void;
  disabled?: boolean;
}

export function ConsentFields({ campaign, consent, onChange, disabled }: ConsentFieldsProps) {
  if (!campaign.requireLegalAcceptance) return null;
  const needsTerms = Boolean(campaign.termsConditions);
  const needsPrivacy = Boolean(campaign.privacyPolicy);
  const needsRules = Boolean(campaign.officialRules);
  if (!needsTerms && !needsPrivacy && !needsRules) return null;

  return (
    <div className="space-y-2 text-sm">
      {needsTerms && (
        <label className="flex items-start gap-2">
          <input type="checkbox" disabled={disabled} checked={Boolean(consent.terms)} onChange={(e) => onChange({ ...consent, terms: e.target.checked })} required />
          <span>I accept the terms</span>
        </label>
      )}
      {needsPrivacy && (
        <label className="flex items-start gap-2">
          <input type="checkbox" disabled={disabled} checked={Boolean(consent.privacy)} onChange={(e) => onChange({ ...consent, privacy: e.target.checked })} required />
          <span>I accept the privacy policy</span>
        </label>
      )}
      {needsRules && (
        <label className="flex items-start gap-2">
          <input type="checkbox" disabled={disabled} checked={Boolean(consent.rules)} onChange={(e) => onChange({ ...consent, rules: e.target.checked })} required />
          <span>I accept the official rules</span>
        </label>
      )}
    </div>
  );
}
