import { Navigate } from 'react-router-dom';

/** Legacy account settings entry — redirected into the Settings hub. */
export function SettingsPage() {
  return <Navigate to="/settings/profile" replace />;
}
