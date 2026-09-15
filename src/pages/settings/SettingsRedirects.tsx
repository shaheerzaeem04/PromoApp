import { Navigate, useSearchParams } from 'react-router-dom';

const TAB_MAP: Record<string, string> = {
  general: '/settings/general',
  team: '/settings/team',
  billing: '/settings/billing',
  api: '/settings/integrations?tab=api',
  danger: '/settings/general#danger',
};

/** Back-compat redirect from /workspace?tab=* */
export function WorkspaceSettingsRedirect() {
  const [params] = useSearchParams();
  const tab = params.get('tab') || (params.get('checkout') ? 'billing' : 'general');
  const target = TAB_MAP[tab] || '/settings/general';
  const search = params.get('checkout') ? '?checkout=1' : '';
  return <Navigate to={`${target}${search}`} replace />;
}

export function IntegrationsListRedirect() {
  return <Navigate to="/settings/integrations" replace />;
}

export function DeliveryLogRedirect() {
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={`/settings/integrations?tab=logs${qs ? `&${qs}` : ''}`} replace />;
}
