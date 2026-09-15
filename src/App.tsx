import { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi, publicApi } from './services/api';
import { PageSpinner, RouteSpinner } from './components/ui';
import { lazyNamed } from './utils/lazyNamed';

import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { MarketingLayout } from './pages/marketing/MarketingLayout';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { NotFoundPage, ForbiddenPage, UnexpectedErrorPage } from './pages/system/ErrorPages';
import {
  DeliveryLogRedirect,
  IntegrationsListRedirect,
  WorkspaceSettingsRedirect,
} from './pages/settings/SettingsRedirects';

const VerifyEmailPage = lazyNamed(() => import('./pages/auth/VerifyEmail'), 'VerifyEmailPage');
const VerifyEmailChangePage = lazyNamed(() => import('./pages/auth/VerifyEmailChange'), 'VerifyEmailChangePage');
const CheckEmailPage = lazyNamed(() => import('./pages/auth/CheckEmail'), 'CheckEmailPage');
const ChoosePlanPage = lazyNamed(() => import('./pages/billing/ChoosePlanPage'), 'ChoosePlanPage');
const BillingSuccessPage = lazyNamed(() => import('./pages/billing/BillingSuccessPage'), 'BillingSuccessPage');
const HomePage = lazyNamed(() => import('./pages/marketing/HomePage'), 'HomePage');
const FeaturesPage = lazyNamed(() => import('./pages/marketing/FeaturesPage'), 'FeaturesPage');
const PricingPage = lazyNamed(() => import('./pages/marketing/PricingPage'), 'PricingPage');
const MarketingIntegrationsPage = lazyNamed(
  () => import('./pages/marketing/MarketingIntegrationsPage'),
  'MarketingIntegrationsPage'
);
const TermsPage = lazyNamed(() => import('./pages/marketing/LegalPages'), 'TermsPage');
const PrivacyPage = lazyNamed(() => import('./pages/marketing/LegalPages'), 'PrivacyPage');
const LoginPage = lazyNamed(() => import('./pages/auth/Login'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('./pages/auth/Register'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/auth/ForgotPassword'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/auth/ResetPassword'), 'ResetPasswordPage');
const DashboardPage = lazyNamed(() => import('./pages/dashboard/Dashboard'), 'DashboardPage');
const CampaignListPage = lazyNamed(() => import('./pages/campaigns/CampaignList'), 'CampaignListPage');
const CampaignCreatePage = lazyNamed(() => import('./pages/campaigns/CampaignCreate'), 'CampaignCreatePage');
const CampaignDetailPage = lazyNamed(() => import('./pages/campaigns/CampaignDetail'), 'CampaignDetailPage');
const CampaignBuilderPage = lazyNamed(
  () => import('./pages/campaigns/builder/CampaignBuilderPage'),
  'CampaignBuilderPage'
);
const TokenCampaignPreviewPage = lazyNamed(
  () => import('./pages/campaigns/CampaignPreview'),
  'TokenCampaignPreviewPage'
);
const OwnerCampaignPreviewPage = lazyNamed(
  () => import('./pages/campaigns/CampaignPreview'),
  'OwnerCampaignPreviewPage'
);
const HelpCentrePage = lazyNamed(() => import('./pages/help/HelpCentrePage'), 'HelpCentrePage');
const HelpArticlePage = lazyNamed(() => import('./pages/help/HelpArticlePage'), 'HelpArticlePage');
const DevelopersPage = lazyNamed(() => import('./pages/developers/DevelopersPage'), 'DevelopersPage');
const ChangelogPage = lazyNamed(() => import('./pages/changelog/ChangelogPage'), 'ChangelogPage');
const AnalyticsDashboardPage = lazyNamed(
  () => import('./pages/analytics/AnalyticsDashboard'),
  'AnalyticsDashboardPage'
);
const TemplatesPage = lazyNamed(() => import('./pages/templates/TemplatesPage'), 'TemplatesPage');
const SettingsPage = lazyNamed(() => import('./pages/settings/SettingsPage'), 'SettingsPage');
const SettingsGeneralPage = lazyNamed(
  () => import('./pages/settings/SettingsWorkspacePages'),
  'SettingsGeneralPage'
);
const SettingsTeamPage = lazyNamed(
  () => import('./pages/settings/SettingsWorkspacePages'),
  'SettingsTeamPage'
);
const SettingsBillingPage = lazyNamed(() => import('./pages/settings/workspacePanes'), 'SettingsBillingPage');
const SettingsIntegrationsPage = lazyNamed(
  () => import('./pages/settings/SettingsIntegrationsPage'),
  'SettingsIntegrationsPage'
);
const SettingsUsagePage = lazyNamed(() => import('./pages/settings/SettingsUsagePage'), 'SettingsUsagePage');
const SettingsProfilePage = lazyNamed(
  () => import('./pages/settings/SettingsAccountPages'),
  'SettingsProfilePage'
);
const SettingsSecurityPage = lazyNamed(
  () => import('./pages/settings/SettingsAccountPages'),
  'SettingsSecurityPage'
);
const SettingsNotificationsPage = lazyNamed(
  () => import('./pages/settings/SettingsAccountPages'),
  'SettingsNotificationsPage'
);
const SettingsAppearancePage = lazyNamed(
  () => import('./pages/settings/SettingsAccountPages'),
  'SettingsAppearancePage'
);
const SettingsDeleteAccountPage = lazyNamed(
  () => import('./pages/settings/SettingsAccountPages'),
  'SettingsDeleteAccountPage'
);
const WorkspaceSettingsPage = lazyNamed(
  () => import('./pages/workspace/WorkspaceSettings'),
  'WorkspaceSettingsPage'
);
const InviteAcceptPage = lazyNamed(() => import('./pages/workspace/InviteAcceptPage'), 'InviteAcceptPage');
const GiveawayPage = lazyNamed<{ forcedSlug?: string }>(
  () => import('./pages/public/GiveawayPage'),
  'GiveawayPage'
);
const WidgetPage = lazyNamed(() => import('./pages/widget/WidgetPage'), 'WidgetPage');

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
    <Suspense fallback={<RouteSpinner label="Loading page" />}>
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
    </Suspense>
  );
}
