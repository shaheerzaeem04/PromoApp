export const DEFAULT_CAMPAIGN_THEME = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#09090b',
  surfaceColor: '#18181b',
  textColor: '#fafafa',
  mutedTextColor: '#a1a1aa',
  buttonColor: '#6366f1',
  buttonTextColor: '#ffffff',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontFamily: 'Inter',
  borderRadius: '12px',
  accentColor: '#22c55e',
  backgroundImage: '',
};

const FORBIDDEN = [
  /<\/style/gi,
  /<script/gi,
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /@import/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
];

export function sanitizeCustomCss(input?: string | null) {
  if (!input) return '';
  let css = input.slice(0, 20000);
  for (const pattern of FORBIDDEN) {
    css = css.replace(pattern, '/* removed */');
  }
  return css;
}

export function mergeCampaignTheme(theme: unknown) {
  const incoming = theme && typeof theme === 'object' && !Array.isArray(theme)
    ? (theme as Record<string, any>)
    : {};
  return {
    ...DEFAULT_CAMPAIGN_THEME,
    ...incoming,
    headingFont: incoming.headingFont || incoming.fontFamily || DEFAULT_CAMPAIGN_THEME.headingFont,
    bodyFont: incoming.bodyFont || incoming.fontFamily || DEFAULT_CAMPAIGN_THEME.bodyFont,
    fontFamily: incoming.fontFamily || incoming.bodyFont || DEFAULT_CAMPAIGN_THEME.fontFamily,
    buttonColor: incoming.buttonColor || incoming.primaryColor || DEFAULT_CAMPAIGN_THEME.buttonColor,
    surfaceColor: incoming.surfaceColor || DEFAULT_CAMPAIGN_THEME.surfaceColor,
    mutedTextColor: incoming.mutedTextColor || DEFAULT_CAMPAIGN_THEME.mutedTextColor,
    buttonTextColor: incoming.buttonTextColor || DEFAULT_CAMPAIGN_THEME.buttonTextColor,
  };
}

export function themeToCssVars(theme: ReturnType<typeof mergeCampaignTheme>, campaign?: {
  backgroundImageUrl?: string | null;
  fontFamily?: string | null;
}) {
  const heading = campaign?.fontFamily || theme.headingFont;
  const body = theme.bodyFont || theme.fontFamily;
  return {
    ['--c-bg' as string]: theme.backgroundColor,
    ['--c-surface' as string]: theme.surfaceColor,
    ['--c-text' as string]: theme.textColor,
    ['--c-muted' as string]: theme.mutedTextColor,
    ['--c-primary' as string]: theme.primaryColor,
    ['--c-secondary' as string]: theme.secondaryColor,
    ['--c-accent' as string]: theme.accentColor,
    ['--c-button' as string]: theme.buttonColor,
    ['--c-button-text' as string]: theme.buttonTextColor,
    ['--c-radius' as string]: theme.borderRadius,
    ['--c-heading' as string]: heading,
    ['--c-body' as string]: body,
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: body,
    backgroundImage: campaign?.backgroundImageUrl || theme.backgroundImage
      ? `url(${campaign?.backgroundImageUrl || theme.backgroundImage})`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as React.CSSProperties;
}

const FONT_ALLOWLIST = new Set([
  'Inter', 'Poppins', 'Playfair Display', 'DM Sans', 'Space Grotesk', 'Merriweather',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway', 'Oswald', 'Source Sans Pro',
  'Nunito', 'Work Sans', 'Quicksand', 'Outfit', 'Plus Jakarta Sans', 'Sora', 'Manrope',
]);

export function googleFontHref(fonts: string[]) {
  const unique = [...new Set(fonts.filter((font) => FONT_ALLOWLIST.has(font)))];
  if (unique.length === 0) return null;
  const family = unique.map((font) => `family=${encodeURIComponent(font)}:wght@400;600;700`).join('&');
  return `https://fonts.googleapis.com/css2?${family}&display=swap`;
}
