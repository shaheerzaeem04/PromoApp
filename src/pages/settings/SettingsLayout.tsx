import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Plug,
  BarChart3,
  CreditCard,
  User,
  Shield,
  Bell,
  Palette,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/ui';

const WORKSPACE_NAV = [
  { to: '/settings/general', label: 'General', icon: Building2 },
  { to: '/settings/team', label: 'Team Members', icon: Users },
  { to: '/settings/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings/usage', label: 'Usage', icon: BarChart3 },
  { to: '/settings/billing', label: 'Billing', icon: CreditCard },
];

const ACCOUNT_NAV = [
  { to: '/settings/profile', label: 'General', icon: User },
  { to: '/settings/security', label: 'Security', icon: Shield },
  { to: '/settings/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings/appearance', label: 'Appearance', icon: Palette },
  { to: '/settings/account', label: 'Danger Zone', icon: Trash2 },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof User }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all',
          isActive
            ? 'bg-primary-500/10 text-primary-400'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
        )
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const allNav = [...WORKSPACE_NAV, ...ACCOUNT_NAV];
  const current = allNav.find((item) => location.pathname === item.to)?.to || allNav[0].to;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <PageHeader title="Settings" description="Workspace and account settings for PromoApp." />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0 space-y-4">
          <label className="lg:hidden block">
            <span className="sr-only">Settings section</span>
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
              aria-label="Settings section"
              value={current}
              onChange={(event) => navigate(event.target.value)}
            >
              <optgroup label="Workspace">
                {WORKSPACE_NAV.map((item) => (
                  <option key={item.to} value={item.to}>{item.label}</option>
                ))}
              </optgroup>
              <optgroup label="Personal">
                {ACCOUNT_NAV.map((item) => (
                  <option key={item.to} value={item.to}>{item.label}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <nav className="hidden lg:block space-y-4" aria-label="Settings">
            <div className="space-y-1">
              <p className="px-3 text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Workspace</p>
              {WORKSPACE_NAV.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
            <div className="space-y-1">
              <p className="px-3 text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Personal</p>
              {ACCOUNT_NAV.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </nav>
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
