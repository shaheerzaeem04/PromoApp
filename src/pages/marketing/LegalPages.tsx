export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-invert">
      <p className="text-amber-400 text-sm font-medium">LEGAL REVIEW REQUIRED — placeholder terms, not certified legal advice.</p>
      <h1 className="text-4xl font-display font-bold mt-4">Terms of Service</h1>
      <p className="text-zinc-400 mt-4">Last updated: 1 September 2026</p>
      <div className="text-zinc-300 space-y-4 mt-8">
        <p>PromoApp provides software for creating and hosting promotional campaigns. By creating an account you agree to use the service lawfully, to obtain any permits your contest requires, and not to upload unlawful content.</p>
        <p>You are responsible for campaign rules, prize fulfillment, participant data you collect, and any marketing messages you send through connected providers.</p>
        <p>Paid plans are billed through Stripe when configured. Canceling a subscription does not immediately delete workspace data; see the Privacy Policy and in-app deletion controls.</p>
        <p>These terms are a working draft for product launch readiness and must be reviewed by qualified counsel before production use.</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-amber-400 text-sm font-medium">LEGAL REVIEW REQUIRED — placeholder privacy policy, not a compliance certification.</p>
      <h1 className="text-4xl font-display font-bold mt-4">Privacy Policy</h1>
      <p className="text-zinc-400 mt-4">Last updated: 1 September 2026</p>
      <div className="text-zinc-300 space-y-4 mt-8">
        <p>We process account data (name, email, hashed password), workspace membership, campaign configuration, and participant entries you collect through campaigns you publish.</p>
        <p>Uploads are stored on local disk in development or private object storage in production. Download requires campaign/workspace authorization. Buckets are not publicly listed.</p>
        <p>Payment details are handled by Stripe. We store customer and subscription identifiers, not card numbers.</p>
        <p>You can delete an account after transferring or scheduling deletion of workspaces you own. Soft-deleted workspaces are retained for a configured period before purge.</p>
        <p>This page does not claim GDPR, CCPA, SOC 2, or other certifications.</p>
      </div>
    </div>
  );
}
