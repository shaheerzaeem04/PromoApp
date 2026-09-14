export type HelpCategory =
  | 'Getting Started'
  | 'Campaign Builder'
  | 'Entry Actions'
  | 'Design'
  | 'Publishing'
  | 'Integrations'
  | 'Winners'
  | 'Analytics'
  | 'Teams'
  | 'Billing'
  | 'Troubleshooting';

export interface HelpArticle {
  slug: string;
  title: string;
  category: HelpCategory;
  summary: string;
  body: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'create-your-first-giveaway',
    title: 'Create your first giveaway',
    category: 'Getting Started',
    summary: 'Start from scratch or a template, then walk the builder steps.',
    body: `Open Campaigns → New campaign. Choose Start from Scratch or a template. The builder opens on Basics: add a title (at least 3 characters) and a short description.

Continue through Schedule, Eligibility, Entry Form, Prizes, and Actions. You can save a draft at any time. Publishing requires at least one prize and one entry action.

After you save, PromoApp creates a draft campaign. The live public page is /c/{slug} only after you publish.`,
  },
  {
    slug: 'publish-a-campaign',
    title: 'Publish a campaign',
    category: 'Publishing',
    summary: 'Activate immediately or schedule a start time.',
    body: `On the builder Review step, click Publish / Activate. If launch mode is scheduled and the start date is in the future, the campaign becomes SCHEDULED and turns ACTIVE when the lifecycle worker reaches that time.

Otherwise it becomes ACTIVE immediately. Active campaigns must have a prize and an entry action. Scheduled campaigns still need those before they can go live.

Draft campaigns can be previewed by the owner. Public visitors only see ACTIVE campaigns within their start/end window.`,
  },
  {
    slug: 'embed-on-a-website',
    title: 'Embed on a website',
    category: 'Publishing',
    summary: 'Use the hosted page or the JavaScript widget.',
    body: `Every campaign has a hosted URL at /c/{slug}. Copy it from Campaign → Publishing.

To embed on your site, copy the widget snippet for Inline, Popup, Banner, or Slide-in. The widget loads /widget.js from PromoApp, not from the host page origin. Set allowed domains if you restrict embeds.

The iframe talks to PromoApp’s API for embed-config. Do not paste owner JWTs into the widget.`,
  },
  {
    slug: 'popup-campaigns',
    title: 'Popup campaigns',
    category: 'Design',
    summary: 'Delay, scroll, exit-intent, and frequency caps.',
    body: `In the builder Display step, set display mode to POPUP. Choose a trigger: immediate, delay, scroll, exit intent, or click. Delay and scroll percent are saved on the campaign and honored by widget.js.

Frequency hours control how long a dismissed popup stays hidden on that host. Mobile can be disabled separately. Banner and slide-in use the same trigger family.`,
  },
  {
    slug: 'referral-campaigns',
    title: 'Referral campaigns',
    category: 'Campaign Builder',
    summary: 'Bonus points when participants invite friends.',
    body: `Enable referrals on the Referrals step. Set bonus points per successful referred signup. After someone enters, they receive a referral link with ?ref=CODE.

The public page shows a referral panel and optional leaderboard. Referral abuse is scored in fraud review; it does not auto-block by itself.`,
  },
  {
    slug: 'entry-actions-explained',
    title: 'Entry actions explained',
    category: 'Entry Actions',
    summary: 'How participants earn points after they enter.',
    body: `Entry actions are tasks on a campaign: visit a URL, follow a network, subscribe, upload a file, enter a secret code, complete a webhook, and more. Each action has points, optional daily/total limits, and a required flag.

Your plan controls which action types you may add. WEBHOOK_COMPLETE is available on Business and Premium. Actions run on the public page after the participant has entered.`,
  },
  {
    slug: 'honor-system-vs-verified',
    title: 'Honor-system vs verified actions',
    category: 'Entry Actions',
    summary: 'What PromoApp can prove versus what it records on trust.',
    body: `Some actions are honor-system: the participant confirms they did the task. Others are verified: secret codes, uploads, newsletter webhooks, and inbound WEBHOOK_COMPLETE.

Honor-system actions still create entries and points. Use fraud review and winner rules if you need extra checks. Do not treat honor-system follows as cryptographic proof.`,
  },
  {
    slug: 'custom-forms',
    title: 'Custom forms',
    category: 'Campaign Builder',
    summary: 'Collect extra fields beyond email and name.',
    body: `On the Entry Form step, add custom fields (text, select, checkbox, and similar). Mark fields required if needed. Values are stored on the participant and can be mapped into ESP integrations via field mapping.

Do not collect payment card data in custom fields.`,
  },
  {
    slug: 'upload-actions',
    title: 'Upload actions',
    category: 'Entry Actions',
    summary: 'Accept files as an entry method.',
    body: `Add an upload entry action if your plan allows file uploads. Participants attach a file after they enter. Size limits follow the workspace plan. Files are stored with the campaign’s upload settings.

Review uploads before drawing winners if the prize depends on the file.`,
  },
  {
    slug: 'secret-codes',
    title: 'Secret codes',
    category: 'Entry Actions',
    summary: 'Offline or in-pack codes that grant points.',
    body: `Create codes on the campaign Secret Codes tab, then add a SECRET_CODE entry action. Participants redeem a code on the public page. Codes can have max uses and expiry.

Invalid or used codes are rejected. Import and generate tools live on the same tab.`,
  },
  {
    slug: 'winner-selection',
    title: 'Winner selection',
    category: 'Winners',
    summary: 'Draw fairly from eligible entries.',
    body: `Open the Winners tab. Draw randomly for a prize, optionally excluding previous winners and disqualified participants. High-risk participants can be skipped unless you explicitly proceed.

Notify winners from the same tab. Winner selected events can sync to webhooks and Zapier.`,
  },
  {
    slug: 'fraud-review',
    title: 'Fraud review',
    category: 'Winners',
    summary: 'Clear, flag, or disqualify participants.',
    body: `The Fraud tab lists risk signals such as referral clusters and device clustering. Review status is CLEARED, FLAGGED, or DISQUALIFIED. Disqualified participants are excluded from draws when that option is on.

PromoApp does not sell fingerprinting. Device clustering uses a hashed anonymous visitor id when provided.`,
  },
  {
    slug: 'analytics',
    title: 'Analytics',
    category: 'Analytics',
    summary: 'Campaign and workspace performance.',
    body: `Campaign Analytics shows entries, participants, and funnel metrics. Workspace Analytics aggregates campaigns for a date range and can export CSV.

Advanced analytics depends on your plan. Product onboarding milestones (first campaign, first participant) are separate from participant campaign analytics.`,
  },
  {
    slug: 'custom-domains',
    title: 'Custom domains',
    category: 'Publishing',
    summary: 'Serve a giveaway on your hostname.',
    body: `On Publishing, add a hostname and create the CNAME PromoApp shows. Click Verify DNS. TLS provisioning follows after DNS succeeds.

Custom domains are plan-gated. Until verified, visitors should use the PromoApp hosted URL.`,
  },
  {
    slug: 'connect-mailchimp',
    title: 'Connect Mailchimp',
    category: 'Integrations',
    summary: 'API key, server prefix, and audience selection.',
    body: `Integrations → Add → Mailchimp. Paste an API key and the server prefix (the part before .api.mailchimp.com). Test the connection, then pick an audience from the discovered list (or enter a list ID).

Assign the integration on the campaign Publishing tab with trigger Participant created. If the campaign requires legal acceptance, Mailchimp only syncs participants who accepted privacy.`,
  },
  {
    slug: 'connect-klaviyo',
    title: 'Connect Klaviyo',
    category: 'Integrations',
    summary: 'Private API key and list destination.',
    body: `Add a Klaviyo integration with a private API key. Test, then choose a list. Assign it to the campaign. Klaviyo is a marketing ESP: consent rules apply when the campaign requires legal acceptance.

Klaviyo is available on Free and above, subject to the workspace integration count.`,
  },
  {
    slug: 'google-sheets',
    title: 'Google Sheets',
    category: 'Integrations',
    summary: 'OAuth connection, then spreadsheet and tab.',
    body: `Google Sheets uses workspace OAuth, not a pasted password. Connect Google from Integrations when GOOGLE_SHEETS_CLIENT_ID is configured on the server. Then create a Sheets integration with spreadsheet ID and sheet name.

Tokens stay encrypted on the server. The UI never shows refresh tokens.`,
  },
  {
    slug: 'webhooks-zapier',
    title: 'Webhooks / Zapier',
    category: 'Integrations',
    summary: 'Works with Zapier Webhooks Catch Hook.',
    body: `This is not an official Zapier Marketplace app. Create a Zapier / Automation Webhook integration (Business plan). Paste your Catch Hook URL, choose events, save, and send a test event.

PromoApp POSTs JSON with event, campaign, workspace, timestamp, deliveryId, and safe data. Optional HMAC header X-PromoApp-Signature uses sha256=. Verify it before trusting the body. Do not expect JWTs or Stripe objects in the payload.

Inbound WEBHOOK_COMPLETE actions are separate: they complete a configured entry action with X-Promo-Webhook-Secret.`,
  },
  {
    slug: 'team-members',
    title: 'Team members',
    category: 'Teams',
    summary: 'Invite admins and members to a workspace.',
    body: `Workspace → invite by email. Roles are Owner, Admin, and Member. Integrations require the integrations.manage permission. Billing and transfers are owner/admin capabilities.

Invites need a verified email on the inviter account.`,
  },
  {
    slug: 'billing-plans',
    title: 'Billing / plans',
    category: 'Billing',
    summary: 'Free, Starter, Business, Premium.',
    body: `Plans control campaign limits, action types, custom domains, webhooks, API keys, and which integration providers you may connect. Zapier/custom webhooks need Business or Premium. AWeber and Keap are Premium and still need live OAuth credentials.

Upgrade from Workspace billing. If Stripe is not configured, checkout shows as unavailable rather than a fake success.`,
  },
  {
    slug: 'troubleshooting-widget-embeds',
    title: 'Troubleshooting widget embeds',
    category: 'Troubleshooting',
    summary: 'Origin, domains, and mixed content.',
    body: `The widget must load from your PromoApp origin. Check the script src and data-origin. If you restricted embed domains, add the host that serves the page.

Popups blocked by frequency will not reopen until the cap expires. Mixed content (HTTP page loading HTTPS widget) can fail. Preview in the builder does not create participants.`,
  },
  {
    slug: 'email-verification',
    title: 'Email verification',
    category: 'Getting Started',
    summary: 'Unlock billing, invites, and custom domains.',
    body: `After register, PromoApp signs you in and sends a verification link. In local development the link is printed to the API console if SMTP is not configured.

Verify from the banner or Settings. Unverified accounts can still build campaigns but cannot invite teammates or manage billing.`,
  },
];

export function searchHelpArticles(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;

  return HELP_ARTICLES
    .map((article) => {
      const title = article.title.toLowerCase();
      const summary = article.summary.toLowerCase();
      const category = article.category.toLowerCase();
      const body = article.body.toLowerCase();
      let score = 0;
      if (title.startsWith(q)) score += 6;
      else if (title.includes(q)) score += 4;
      if (summary.includes(q)) score += 2;
      if (category.includes(q)) score += 2;
      if (body.includes(q)) score += 1;
      return { article, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .map((row) => row.article);
}
