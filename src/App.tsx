import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi } from './services/api';
import { PageSpinner, RouteSpinner } from './components/ui';

import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { VerifyEmailPage } from './pages/auth/VerifyEmail';
import { VerifyEmailChangePage } from './pages/auth/VerifyEmailChange';
import { CheckEmailPage } from './pages/auth/CheckEmail';
import { ChoosePlanPage } from './pages/billing/ChoosePlanPage';
import { BillingSuccessPage } from './pages/billing/BillingSuccessPage';
import { MarketingLayout } from './pages/marketing/MarketingLayout';
import { HomePage } from './pages/marketing/HomePage';
import { FeaturesPage } from './pages/marketing/FeaturesPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { MarketingIntegrationsPage } from './pages/marketing/MarketingIntegrationsPage';
import { TermsPage, PrivacyPage } from './pages/marketing/LegalPages';
import { NotFoundPage, ForbiddenPage, UnexpectedErrorPage } from './pages/system/ErrorPages';

import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { ForgotPasswordPage } from './pages/auth/ForgotPassword';
import { ResetPasswordPage } from './pages/auth/ResetPassword';

import { DashboardPage } from './pages/dashboard/Dashboard';
import { CampaignListPage } from './pages/campaigns/CampaignList';
import { CampaignCreatePage } from './pages/campaigns/CampaignCreate';
import { CampaignDetailPage } from './pages/campaigns/CampaignDetail';
import { CampaignBuilderPage } from './pages/campaigns/builder/CampaignBuilderPage';
import { TokenCampaignPreviewPage, OwnerCampaignPreviewPage } from './pages/campaigns/CampaignPreview';
import { HelpCentrePage } from './pages/help/HelpCentrePage';
import { HelpArticlePage } from './pages/help/HelpArticlePage';
import { DevelopersPage } from './pages/developers/DevelopersPage';
import { ChangelogPage } from './pages/changelog/ChangelogPage';
import { AnalyticsDashboardPage } from './pages/analytics/AnalyticsDashboard';
import { TemplatesPage } from './pages/templates/TemplatesPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { SettingsGeneralPage, SettingsTeamPage } from './pages/settings/SettingsWorkspacePages';
import { SettingsBillingPage } from './pages/settings/workspacePanes';
import { SettingsIntegrationsPage } from './pages/settings/SettingsIntegrationsPage';
import { SettingsUsagePage } from './pages/settings/SettingsUsagePage';
import {
  SettingsProfilePage,
  SettingsSecurityPage,
  SettingsNotificationsPage,
  SettingsAppearancePage,
  SettingsDeleteAccountPage,
} from './pages/settings/SettingsAccountPages';
import {
  DeliveryLogRedirect,
  IntegrationsListRedirect,
  WorkspaceSettingsRedirect,
} from './pages/settings/SettingsRedirects';
import { WorkspaceSettingsPage } from './pages/workspace/WorkspaceSettings';
import { InviteAcceptPage } from './pages/workspace/InviteAcceptPage';

import { GiveawayPage } from './pages/public/GiveawayPage';
import { WidgetPage } from './pages/widget/WidgetPage';
import { publicApi } from './services/api';

function CustomDomainGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ loading: boolean; slug?: string }>({ loading: true });

  useEffect(() => {
    publicApi
      .resolveHost()
      .then((response) => {
        const data = response.data?.data;
        if (data?.customDomain && data.slug) {
          setState({ loading: false, slug: data.slug });
        } else {
          setState({ loading: false });
        }
      })
      .catch(() => setState({ loading: false }));
  }, []);

  if (state.loading) return <PageSpinner />;
  if (state.slug) return <GiveawayPage forcedSlug={state.slug} />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<'checking' | 'ok' | 'no'>('checking');

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const { isAuthenticated: authed, accessToken, updateUser } = useAuthStore.getState();
      if (!authed || !accessToken) {
        if (!cancelled) setStatus('no');
        return;
      }

      try {
        const response = await authApi.getProfile();
        if (!cancelled) {
          updateUser(response.data.data);
          setStatus('ok');
        }
      } catch (error: any) {
        const statusCode = error?.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          useAuthStore.getState().logout();
          if (!cancelled) setStatus('no');
          return;
        }
        if (useAuthStore.getState().isAuthenticated) {
          if (!cancelled) setStatus('ok');
        } else if (!cancelled) {
          setStatus('no');
        }
      }
    }

    setStatus('checking');
    hydrate();

    // Browser Back from bfcache can restore a stale dashboard paint — re-gate with spinner.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setStatus('checking');
      hydrate();
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  if (status === 'checking') {
    return <RouteSpinner label="Loading workspace" />;
  }

  if (status === 'no' || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    return <Navigate to={user?.emailVerified ? '/dashboard' : '/check-email'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <CustomDomainGate>
    <Routes>
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route path="/widget/:slug" element={<WidgetPage />} />
      <Route path="/preview/:token" element={<TokenCampaignPreviewPage />} />
      <Route path="/c/:slug" element={<GiveawayPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-change/:token" element={<VerifyEmailChangePage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<UnexpectedErrorPage />} />
      <Route
        path="/campaigns/:id/preview"
        element={
          <ProtectedRoute>
            <OwnerCampaignPreviewPage />
          </ProtectedRoute>
        }
      />

      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/product-integrations" element={<MarketingIntegrationsPage />} />
        <Route path="/help" element={<HelpCentrePage />} />
        <Route path="/help/:slug" element={<HelpArticlePage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>

      <Route
        element={
          <GuestRoute>
            <AuthLayout />
          </GuestRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/campaigns" element={<CampaignListPage />} />
        <Route path="/campaigns/new" element={<CampaignCreatePage />} />
        <Route path="/campaigns/:id/edit" element={<CampaignBuilderPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/analytics" element={<AnalyticsDashboardPage />} />
        <Route path="/integrations" element={<IntegrationsListRedirect />} />
        <Route path="/integrations/deliveries" element={<DeliveryLogRedirect />} />
        <Route path="/workspace" element={<WorkspaceSettingsRedirect />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<SettingsGeneralPage />} />
          <Route path="team" element={<SettingsTeamPage />} />
          <Route path="integrations" element={<SettingsIntegrationsPage />} />
          <Route path="usage" element={<SettingsUsagePage />} />
          <Route path="billing" element={<SettingsBillingPage />} />
          <Route path="profile" element={<SettingsProfilePage />} />
          <Route path="security" element={<SettingsSecurityPage />} />
          <Route path="notifications" element={<SettingsNotificationsPage />} />
          <Route path="appearance" element={<SettingsAppearancePage />} />
          <Route path="account" element={<SettingsDeleteAccountPage />} />
        </Route>
        <Route path="/settings-legacy" element={<SettingsPage />} />
        <Route path="/workspace-legacy" element={<WorkspaceSettingsPage />} />
        <Route path="/choose-plan" element={<ChoosePlanPage />} />
        <Route path="/billing/success" element={<BillingSuccessPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </CustomDomainGate>
  );
}
