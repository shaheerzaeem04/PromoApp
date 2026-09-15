import { Checkbox } from '../components/ui';

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
        <Checkbox
          tone="giveaway"
          isDisabled={disabled}
          isRequired
          isSelected={Boolean(consent.terms)}
          onChange={(checked) => onChange({ ...consent, terms: checked })}
        >
          I accept the terms
        </Checkbox>
      )}
      {needsPrivacy && (
        <Checkbox
          tone="giveaway"
          isDisabled={disabled}
          isRequired
          isSelected={Boolean(consent.privacy)}
          onChange={(checked) => onChange({ ...consent, privacy: checked })}
        >
          I accept the privacy policy
        </Checkbox>
      )}
      {needsRules && (
        <Checkbox
          tone="giveaway"
          isDisabled={disabled}
          isRequired
          isSelected={Boolean(consent.rules)}
          onChange={(checked) => onChange({ ...consent, rules: checked })}
        >
          I accept the official rules
        </Checkbox>
      )}
    </div>
  );
}
