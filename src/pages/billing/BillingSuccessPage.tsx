import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { billingApi } from '../../services/api';
import { Card, Button } from '../../components/ui';
import { useQueryClient } from '@tanstack/react-query';

const MAX_POLLS = 8;

export function BillingSuccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState<'polling' | 'waiting' | 'error'>('polling');

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      while (!cancelled && attempt < MAX_POLLS) {
        attempt += 1;
        try {
          const response = await billingApi.summary();
          const data = response.data.data;
          queryClient.setQueryData(['billing-summary'], data);
          if (data.lifecycle === 'TRIALING' || data.lifecycle === 'ACTIVE') {
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch {
          if (attempt >= MAX_POLLS && !cancelled) setState('error');
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      if (!cancelled) setState('waiting');
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [navigate, queryClient]);

  return (
    <Card className="p-8 max-w-lg mx-auto text-center space-y-4" data-testid="billing-success">
      <h1 className="text-2xl font-display font-bold">
        {state === 'polling' ? 'Setting up your trial…' : "We're confirming your subscription."}
      </h1>
      <p className="text-zinc-400">
        Stripe is the source of truth. This page waits for a verified subscription — returning from Checkout does not activate a plan by itself.
      </p>
      {state !== 'polling' && (
        <div className="flex justify-center gap-3">
          <Button onClick={() => window.location.reload()} data-testid="billing-success-refresh">Refresh</Button>
          <Link to="/settings/billing" className="btn-secondary inline-flex">Billing</Link>
        </div>
      )}
      {state === 'polling' && (
        <Button onClick={() => window.location.reload()} data-testid="billing-success-refresh">Refresh</Button>
      )}
    </Card>
  );
}
