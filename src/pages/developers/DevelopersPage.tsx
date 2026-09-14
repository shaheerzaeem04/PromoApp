import { useQuery } from '@tanstack/react-query';
import { KeyRound, Link2, ShieldCheck, Webhook } from 'lucide-react';
import { docsApi } from '../../services/api';

const HMAC_JS = `import crypto from 'node:crypto';

export function verifyPromoAppSignature(secret, rawBody, header) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header || ''));
}`;

const HMAC_PHP = `function verify_promoapp_signature(string $secret, string $rawBody, string $header): bool {
  $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
  return hash_equals($expected, $header);
}`;

const HMAC_PY = `import hashlib, hmac

def verify_promoapp_signature(secret: str, raw_body: bytes, header: str) -> bool:
    expected = 'sha256=' + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header or '')`;

const COMPLETE_JS = `const res = await fetch('https://api.example.com/api/webhooks/actions/wh_ACTION_KEY/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Promo-Webhook-Secret': 'whs_YOUR_SECRET',
  },
  body: JSON.stringify({ email: 'participant@example.com', idempotencyKey: 'entry-1' }),
});`;

const WEBHOOK_PAYLOAD = `{
  "event": "participant.created",
  "campaign": { "id": "uuid", "title": "Summer giveaway" },
  "workspace": { "id": "uuid" },
  "timestamp": "2026-09-01T12:00:00.000Z",
  "deliveryId": "del_...",
  "data": { "participant": { "email": "a@example.com", "name": "Ann", "points": 1 } }
}`;

const READ_ENDPOINTS = [
  'GET /campaigns',
  'GET /campaigns/{id}',
  'GET /campaigns/{id}/participants',
  'GET /campaigns/{id}/entries',
  'GET /campaigns/{id}/winners',
  'GET /campaigns/{id}/analytics',
] as const;

const SECTIONS = [
  { id: 'auth', label: 'Authentication', icon: KeyRound },
  { id: 'base', label: 'Base URL', icon: Link2 },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'hmac', label: 'HMAC', icon: ShieldCheck },
] as const;

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="mt-3">
      {label && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
          {label}
        </p>
      )}
      <pre className="docs-code p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

export function DevelopersPage() {
  const { data } = useQuery({
    queryKey: ['openapi'],
    queryFn: () => docsApi.openapi(),
  });
  const spec = data?.data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 mb-3">
          Developers
        </p>
        <h1 className="text-4xl font-display font-bold text-[#0B1020]">Developer documentation</h1>
        <p className="text-[#667085] mt-3 leading-relaxed">
          Public API for workspace data, outbound webhooks, and inbound WEBHOOK_COMPLETE actions.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#667085] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:text-primary-700 hover:bg-primary-50"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          ))}
        </div>
      </div>

      <section id="auth" className="docs-panel p-5 scroll-mt-24">
        <h2 className="text-xl font-semibold text-[#0B1020]">Authentication</h2>
        <p className="text-[#667085] mt-2 leading-relaxed">
          Create an API key in Workspace → API keys (Premium). Send it as <code>X-API-Key</code>.
          Keys are shown once at creation. Do not put owner JWTs in widgets or Zapier.
        </p>
      </section>

      <section id="base" className="docs-panel p-5 scroll-mt-24">
        <h2 className="text-xl font-semibold text-[#0B1020]">Base URL</h2>
        <CodeBlock>{`{API_URL}/api/v1`}</CodeBlock>
        <p className="text-sm text-[#667085] mt-3">
          OpenAPI: GET /api/docs/openapi.json {spec ? `(v${spec.info?.version})` : ''}
        </p>
      </section>

      <section className="docs-panel p-5">
        <h2 className="text-xl font-semibold text-[#0B1020]">Pagination, rate limits, errors</h2>
        <p className="text-[#667085] mt-2 leading-relaxed">
          List endpoints accept <code>page</code> and <code>limit</code> and return a <code>pagination</code> object.
          Authenticated API routes are rate limited per IP/workspace. Errors use{' '}
          <code>{`{ success: false, error: { message, code } }`}</code>.
        </p>
      </section>

      <section className="docs-panel p-5">
        <h2 className="text-xl font-semibold text-[#0B1020]">Read endpoints</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {READ_ENDPOINTS.map((endpoint) => (
            <li
              key={endpoint}
              className="rounded-lg border border-[#E8EAF0] bg-[#F8FAFC] px-3 py-2 font-mono text-xs text-[#334155] transition-all duration-200 hover:border-primary-500/35 hover:bg-primary-50/60 hover:text-primary-800"
            >
              {endpoint}
            </li>
          ))}
        </ul>
      </section>

      <section id="webhooks" className="docs-panel p-5 scroll-mt-24">
        <h2 className="text-xl font-semibold text-[#0B1020]">Outbound webhooks</h2>
        <p className="text-[#667085] mt-2 leading-relaxed">
          Zapier / custom webhook integrations POST JSON with event, campaign, workspace, timestamp, deliveryId, and safe data.
          Optional HMAC header <code>X-PromoApp-Signature</code> uses <code>sha256=</code>. Payloads never include JWTs, passwords, Stripe objects, storage paths, or OAuth secrets.
        </p>
        <p className="text-sm text-[#667085] mt-2">Works with Zapier Webhooks (Catch Hook). Not an official Marketplace app.</p>
        <CodeBlock label="Example payload">{WEBHOOK_PAYLOAD}</CodeBlock>
      </section>

      <section id="hmac" className="docs-panel p-5 scroll-mt-24">
        <h2 className="text-xl font-semibold text-[#0B1020]">HMAC verification</h2>
        <p className="text-xs text-[#667085] mt-1">Examples use placeholders. Never commit real secrets.</p>
        <CodeBlock label="Node.js">{HMAC_JS}</CodeBlock>
        <CodeBlock label="PHP">{HMAC_PHP}</CodeBlock>
        <CodeBlock label="Python">{HMAC_PY}</CodeBlock>
      </section>

      <section className="docs-panel p-5">
        <h2 className="text-xl font-semibold text-[#0B1020]">Inbound WEBHOOK_COMPLETE</h2>
        <p className="text-[#667085] mt-2 leading-relaxed">
          POST /api/webhooks/actions/{'{actionKey}'}/complete with header X-Promo-Webhook-Secret.
          Identify the participant by email or participantId. Idempotency keys prevent duplicate entries.
          Custom fields update only when the action config explicitly allows it.
        </p>
        <CodeBlock label="Example request">{COMPLETE_JS}</CodeBlock>
      </section>
    </div>
  );
}
