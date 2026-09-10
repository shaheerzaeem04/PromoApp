import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { ProductTour } from '../onboarding/ProductTour';
import toast from 'react-hot-toast';
import { RouteSpinner } from '../ui';
import { TrialBanner } from '../billing/TrialBanner';

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Cover Help → browser Back remount: spinner first, then paint the full shell.
    setBooting(true);
    const timeout = window.setTimeout(() => setBooting(false), 120);
    return () => window.clearTimeout(timeout);
  }, []);

  if (booting) {
    return <RouteSpinner label="Loading dashboard" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
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
          <Outlet />
        </div>
      </main>
      <ProductTour />
    </div>
  );
}
