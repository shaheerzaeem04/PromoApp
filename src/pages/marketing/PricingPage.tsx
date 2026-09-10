import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';

function formatLimit(value: number | null) {
  return value == null ? 'Unlimited' : String(value);
}

export function PricingPage() {
  const plans = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const response = await axios.get('/api/public/plans');
      return response.data.data as any[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-display font-bold">Pricing</h1>
      <p className="text-zinc-400 mt-3 max-w-2xl">
        Plan names, descriptions, and limits come from the server catalog. Dollar amounts are not duplicated here; checkout shows Stripe prices when billing is configured.
      </p>
      {plans.isLoading && <p className="mt-8 text-zinc-500">Loading plans…</p>}
      {plans.isError && <p className="mt-8 text-red-400">Could not load plans. Try again later.</p>}
      <div className="grid md:grid-cols-3 gap-4 mt-10">
        {(plans.data || []).filter((plan) => plan.key !== 'FREE').map((plan) => (
          <article key={plan.key} className="card p-6 flex flex-col">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-sm text-zinc-400 mt-2 flex-1">{plan.description}</p>
            <ul className="text-sm text-zinc-300 mt-4 space-y-1">
              <li>{formatLimit(plan.entitlements?.maxCampaigns)} campaigns</li>
              <li>{formatLimit(plan.entitlements?.maxTeamMembers)} seats</li>
              <li>{plan.entitlements?.customDomainEnabled ? 'Custom domains' : 'No custom domains'}</li>
              <li>{plan.entitlements?.apiEnabled ? 'Public API' : 'No public API'}</li>
            </ul>
            <Link to={`/register?plan=${encodeURIComponent(plan.key)}&interval=monthly`} className="btn-primary mt-6 text-center">Start 7-day trial</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
