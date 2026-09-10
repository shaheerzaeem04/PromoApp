import { useEffect } from 'react';
import { mergeCampaignTheme, sanitizeCustomCss, themeToCssVars, googleFontHref } from './theme';

interface CampaignThemeRootProps {
  campaign: any;
  className?: string;
  children: React.ReactNode;
}

export function CampaignThemeRoot({ campaign, className, children }: CampaignThemeRootProps) {
  const theme = mergeCampaignTheme(campaign?.theme);
  const css = sanitizeCustomCss(campaign?.customCss);
  const fontHref = googleFontHref([
    theme.headingFont,
    theme.bodyFont,
    campaign?.fontFamily,
  ].filter(Boolean));

  useEffect(() => {
    if (!fontHref) return;
    const existing = document.querySelector(`link[data-campaign-font="${fontHref}"]`);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontHref;
    link.setAttribute('data-campaign-font', fontHref);
    document.head.appendChild(link);
  }, [fontHref]);

  return (
    <div className={`giveaway-root ${className || ''}`} style={themeToCssVars(theme, campaign)}>
      {css && <style>{css}</style>}
      {children}
    </div>
  );
}
