import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { ProductTour } from '../onboarding/ProductTour';
import toast from 'react-hot-toast';
import { TrialBanner } from '../billing/TrialBanner';
import { PlanGate } from '../billing/PlanGate';

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-lg:pt-14">
        {user && user.emailVerified === false && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-8 py-3 text-sm text-amber-200 flex flex-wrap gap-3 items-center justify-between">
            <span>Verify your email to start a 7-day trial, invite teammates, and add custom domains.</span>
            <button
              type="button"
              className="underline"
              onClick={() => authApi.resendVerification(user.email).then(() => toast.success('If verification is still needed, we sent a new email'))}
            >
              Resend
            </button>
          </div>
        )}
        <TrialBanner />
        <div className="p-4 md:p-6 lg:p-8">
          <PlanGate>
            <Outlet />
          </PlanGate>
        </div>
      </main>
      <ProductTour />
    </div>
  );
}
