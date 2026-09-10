import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  Trophy,
  Settings,
  LogOut,
  Gift,
  BarChart3,
  Plug,
  ChevronLeft,
  Menu,
  X,
  CircleHelp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { authApi, workspaceApi } from '../../services/api';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Gift },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Plug },
];

const secondary = [
  { name: 'Workspace', href: '/workspace', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function initials(name?: string) {
  if (!name) return 'U';
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    workspaceApi.list().then((response) => {
      useWorkspaceStore.getState().setWorkspaces(response.data.data || []);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const { refreshToken, logout: clearAuth } = useAuthStore.getState();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Client state is still cleared so a failed network call cannot leave the UI logged in.
    }
    clearAuth();
    useWorkspaceStore.getState().clearWorkspace();
    window.location.href = '/login';
  };

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm transition-colors',
      active
        ? 'bg-zinc-800 text-zinc-50'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
    );

  const nav = (
    <>
      <div className="flex items-center h-14 px-3 gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-zinc-950" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight">PromoApp</span>
        )}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all hidden lg:inline-flex',
            collapsed && 'absolute left-12 bg-zinc-800'
          )}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
        <button type="button" className="ml-auto lg:hidden p-2" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {workspaces.length > 1 && !collapsed && (
        <div className="px-3 pb-3">
          <label htmlFor="workspace-switcher" className="text-[11px] uppercase tracking-wider text-zinc-500">Workspace</label>
          <select
            id="workspace-switcher"
            data-testid="workspace-switcher"
            value={activeWorkspaceId || ''}
            onChange={(e) => {
              setActiveWorkspaceId(e.target.value);
              window.location.reload();
            }}
            className="mt-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto" aria-label="Primary">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <NavLink key={item.name} to={item.href} className={linkClass(isActive)}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
        <div className={cn('pt-3 mt-2 border-t border-zinc-800/80 space-y-0.5', collapsed && 'border-transparent')}>
          {secondary.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink key={item.name} to={item.href} className={linkClass(isActive)}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
          <NavLink to="/help" className={linkClass(location.pathname.startsWith('/help'))}>
            <CircleHelp className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Help</span>}
          </NavLink>
        </div>
      </nav>

      <div className="p-2 border-t border-zinc-800/80">
        <div className={cn('flex items-center gap-2.5 px-2 py-1.5', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-zinc-200">
            {initials(user?.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout"
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 h-9 rounded-lg text-sm text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-zinc-900 border border-zinc-800 min-h-10 min-w-10"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'flex flex-col h-screen bg-zinc-950 border-r border-zinc-800/80 transition-all duration-200 z-50',
          'fixed inset-y-0 left-0 lg:static',
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-[4.25rem]' : 'lg:w-56',
          'w-60'
        )}
      >
        {nav}
      </aside>
    </>
  );
}
