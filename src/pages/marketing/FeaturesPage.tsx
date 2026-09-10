const features = [
  ['Campaign Builder', 'Guided steps for prizes, actions, schedule, design, and display mode.'],
  ['Referral campaigns', 'Unique codes, bonus points, and public referral URLs.'],
  ['Custom forms', 'Required fields, consent, and extra questions on entry.'],
  ['UGC uploads', 'Photo and PDF submissions with MIME and size checks.'],
  ['Design Studio', 'Themes, presets, and sanitized custom CSS.'],
  ['Templates', 'Start from a gallery instead of a blank campaign.'],
  ['Hosted pages', 'Public campaign URLs on PromoApp.'],
  ['Embeds', 'Inline widget script for third-party sites.'],
  ['Popup / Banner / Slide-in', 'Display modes honored by the widget runtime.'],
  ['Custom domains', 'CNAME verification. TLS is issued by your reverse proxy.'],
  ['Winner draw', 'Weighted, auditable draws with replacement and disqualification.'],
  ['Fraud review', 'Flag, clear, or disqualify participants before a draw.'],
  ['Analytics', 'Views, conversion, referrals, and CSV export.'],
  ['Integrations', 'Mailchimp, Klaviyo, ConvertKit, ActiveCampaign, Omnisend, Beehiiv, and signed webhooks.'],
  ['Teams', 'OWNER / ADMIN / MEMBER roles and invitations.'],
  ['Plans', 'Free through Premium with Stripe Checkout when configured.'],
];

export function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-display font-bold">Features that are actually shipped</h1>
      <p className="text-zinc-400 mt-3 max-w-2xl">This list matches the live product. Anything still environment-dependent is called out on Pricing and Integrations.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {features.map(([title, body]) => (
          <article key={title} className="card p-5 space-y-2 hover:shadow-xl transition-shadow duration-400 cursor-pointer">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-zinc-400 mt-2">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
