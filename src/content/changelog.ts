export interface ChangelogEntry {
  slug: string;
  title: string;
  date: string;
  body: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    slug: 'phase-11-ecosystem',
    title: 'Integrations, Zapier webhooks, help centre, and onboarding',
    date: '2026-09-01',
    body: `PromoApp now includes a broader ESP set (MailerLite, GetResponse, Drip, Campaign Monitor, Brevo, Mailjet, plus OAuth-ready AWeber and Keap adapters), Zapier Catch Hook style automation events, destination discovery, field mapping, delivery logs, a public help centre, developer docs with OpenAPI, and an in-app onboarding checklist.

This is not an official Zapier Marketplace listing. Shopify and full i18n are not part of this release.`,
  },
];
