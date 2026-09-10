import { useQuery } from '@tanstack/react-query';
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

export function DevelopersPage() {
  const { data } = useQuery({
    queryKey: ['openapi'],
    queryFn: () => docsApi.openapi(),
  });
  const spec = data?.data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <div>
        <h1 className="text-4xl font-display font-bold">Developer documentation</h1>
        <p className="text-zinc-400 mt-3">
          Public API for workspace data, outbound webhooks, and inbound WEBHOOK_COMPLETE actions.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold">Authentication</h2>
        <p className="text-zinc-300 mt-2">
          Create an API key in Workspace → API keys (Premium). Send it as <code className="text-primary-300">X-API-Key</code>.
          Keys are shown once at creation. Do not put owner JWTs in widgets or Zapier.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm overflow-x-auto">{`{API_URL}/api/v1`}</pre>
        <p className="text-sm text-zinc-500 mt-2">OpenAPI: GET /api/docs/openapi.json {spec ? `(v${spec.info?.version})` : ''}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Pagination, rate limits, errors</h2>
        <p className="text-zinc-300 mt-2">
          List endpoints accept <code>page</code> and <code>limit</code> and return a <code>pagination</code> object.
          Authenticated API routes are rate limited per IP/workspace. Errors use <code>{`{ success: false, error: { message, code } }`}</code>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Read endpoints</h2>
        <ul className="mt-2 space-y-1 text-zinc-300 text-sm">
          <li>GET /campaigns</li>
          <li>GET /campaigns/{'{id}'}</li>
          <li>GET /campaigns/{'{id}'}/participants</li>
          <li>GET /campaigns/{'{id}'}/entries</li>
          <li>GET /campaigns/{'{id}'}/winners</li>
          <li>GET /campaigns/{'{id}'}/analytics</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Outbound webhooks</h2>
        <p className="text-zinc-300 mt-2">
          Zapier / custom webhook integrations POST JSON with event, campaign, workspace, timestamp, deliveryId, and safe data.
          Optional HMAC header <code>X-PromoApp-Signature</code> uses <code>sha256=</code>. Payloads never include JWTs, passwords, Stripe objects, storage paths, or OAuth secrets.
        </p>
        <p className="text-sm text-zinc-500 mt-2">Works with Zapier Webhooks (Catch Hook). Not an official Marketplace app.</p>
        <pre className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs overflow-x-auto">{`{
  "event": "participant.created",
  "campaign": { "id": "uuid", "title": "Summer giveaway" },
  "workspace": { "id": "uuid" },
  "timestamp": "2026-09-01T12:00:00.000Z",
  "deliveryId": "del_...",
  "data": { "participant": { "email": "a@example.com", "name": "Ann", "points": 1 } }
}`}</pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">HMAC verification</h2>
        <p className="text-xs text-zinc-500 mt-1">Examples use placeholders. Never commit real secrets.</p>
        <pre className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs overflow-x-auto">{HMAC_JS}</pre>
        <pre className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs overflow-x-auto">{HMAC_PHP}</pre>
        <pre className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs overflow-x-auto">{HMAC_PY}</pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Inbound WEBHOOK_COMPLETE</h2>
        <p className="text-zinc-300 mt-2">
          POST /api/webhooks/actions/{'{actionKey}'}/complete with header X-Promo-Webhook-Secret.
          Identify the participant by email or participantId. Idempotency keys prevent duplicate entries.
          Custom fields update only when the action config explicitly allows it.
        </p>
        <pre className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs overflow-x-auto">{COMPLETE_JS}</pre>
      </section>
    </div>
  );
}
