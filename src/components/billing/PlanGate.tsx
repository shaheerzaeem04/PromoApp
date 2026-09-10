import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { billingApi } from '../../services/api';
import { Button, Card, RouteSpinner } from '../ui';

const ALWAYS_ALLOWED = ['/choose-plan', '/billing/success', '/workspace', '/settings', '/check-email'];

function canViewWithoutPlan(pathname: string) {
  if (ALWAYS_ALLOWED.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (pathname === '/campaigns/new') return false;
  if (pathname === '/campaigns') return true;
  if (pathname.startsWith('/campaigns/') && !pathname.includes('/edit')) return true;
  if (pathname === '/analytics' || pathname.startsWith('/analytics/')) return true;
  if (pathname === '/integrations' || pathname.startsWith('/integrations/')) return true;
  return false;
}

export function PlanGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const billing = useQuery({
    queryKey: ['billing-summary'],
    queryFn: () => billingApi.summary().then((r) => r.data.data),
    retry: 1,
    staleTime: 15_000,
  });

  if (canViewWithoutPlan(location.pathname)) return <>{children}</>;
  if (!user?.emailVerified) {
    return <Navigate to="/check-email" replace />;
  }
  if (billing.isPending) {
    return <RouteSpinner label="Loading billing" />;
  }
  if (billing.isError) {
    const status = Number((billing.error as { response?: { status?: number } })?.response?.status);
    if (status === 403) {
      return <div data-testid="plan-gate-inherited">{children}</div>;
    }
    return (
      <Card className="p-6 space-y-3" data-testid="billing-error">
        <p className="text-red-400">Unable to load billing information.</p>
        <Button onClick={() => billing.refetch()}>Retry</Button>
      </Card>
    );
  }
  const data = billing.data;
  if (!data?.stripeConfigured) return <>{children}</>;
  if (data.needsPlan && data.canManageBilling) {
    return <Navigate to="/choose-plan" replace />;
  }
  if (data.needsPlan) {
    return (
      <Card className="p-6 text-zinc-400" data-testid="billing-permission">
        Only the workspace owner can manage billing.
      </Card>
    );
  }
  return <>{children}</>;
}
