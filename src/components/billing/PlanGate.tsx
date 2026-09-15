import { Link, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AlertCircle, CreditCard, RefreshCw, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { billingApi } from '../../services/api';
import { Button, Card, RouteSpinner } from '../ui';
import { cn } from '../../utils/cn';

const ALWAYS_ALLOWED = ['/choose-plan', '/billing/success', '/workspace', '/settings', '/check-email'];

function canViewWithoutPlan(pathname: string) {
  if (ALWAYS_ALLOWED.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  // Dashboard always renders — never replace it with a billing gate panel.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/campaigns/new') return false;
  if (pathname === '/campaigns') return true;
  if (pathname.startsWith('/campaigns/') && !pathname.includes('/edit')) return true;
  if (pathname === '/analytics' || pathname.startsWith('/analytics/')) return true;
  if (pathname === '/integrations' || pathname.startsWith('/integrations/')) return true;
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return true;
  return false;
}

function GatePanel({
  icon,
  tone = 'default',
  eyebrow,
  title,
  description,
  actions,
  testId,
}: {
  icon: ReactNode;
  tone?: 'default' | 'danger' | 'warning';
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  testId: string;
}) {
  const toneRing =
    tone === 'danger'
      ? 'bg-red-500/10 text-red-400 ring-red-500/20'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
        : 'bg-primary-500/10 text-primary-400 ring-primary-500/20';

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center px-4 py-10">
      <Card
        data-testid={testId}
        className="w-full max-w-md p-8 text-center"
      >
        <div
          className={cn(
            'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1',
            toneRing
          )}
        >
          {icon}
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-display font-semibold text-zinc-50">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {actions}
        </div>
      </Card>
    </div>
  );
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
      <GatePanel
        testId="billing-error"
        tone="danger"
        icon={<AlertCircle className="h-7 w-7" aria-hidden />}
        eyebrow="Billing"
        title="Couldn’t load billing"
        description="We couldn’t reach your workspace billing status. Check your connection, then try again. Settings and account pages stay available."
        actions={
          <>
            <Button onClick={() => billing.refetch()} className="sm:min-w-[8.5rem]">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Link to="/settings/billing" className="btn-secondary inline-flex items-center justify-center gap-2 sm:min-w-[8.5rem]">
              <CreditCard className="h-4 w-4" />
              Billing settings
            </Link>
          </>
        }
      />
    );
  }
  const data = billing.data;
  if (!data?.stripeConfigured) return <>{children}</>;
  if (data.needsPlan && data.canManageBilling) {
    return <Navigate to="/choose-plan" replace />;
  }
  if (data.needsPlan) {
    return (
      <GatePanel
        testId="billing-permission"
        tone="warning"
        icon={<Shield className="h-7 w-7" aria-hidden />}
        eyebrow="Plan required"
        title="Ask your workspace owner"
        description="This workspace doesn’t have an active plan yet. Only the owner can start a trial or choose a plan. You can still open Settings while you wait."
        actions={
          <>
            <Link to="/settings/general" className="btn-primary inline-flex items-center justify-center sm:min-w-[8.5rem]">
              Open settings
            </Link>
            <Link to="/dashboard" className="btn-secondary inline-flex items-center justify-center sm:min-w-[8.5rem]">
              Dashboard
            </Link>
          </>
        }
      />
    );
  }
  return <>{children}</>;
}
