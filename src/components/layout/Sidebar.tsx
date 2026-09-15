import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Menu as MenuIcon,
  X,
  CircleHelp,
  LayoutTemplate,
  User,
  Palette,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { authApi, workspaceApi } from '../../services/api';
import { useEffect, useRef, useState } from 'react';
import { Button, MenuTrigger, Menu, MenuItem, MenuSeparator } from '../ui';
import { UserAvatar } from '../account/UserAvatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Gift },
  { name: 'Templates', href: '/templates', icon: LayoutTemplate },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/settings/integrations', icon: Plug },
];

const secondary = [
  {
    name: 'Workspace',
    href: '/settings/general',
    icon: Trophy,
    match: ['/settings/general', '/settings/team', '/settings/usage', '/settings/billing'],
  },
  {
    name: 'Settings',
    href: '/settings/profile',
    icon: Settings,
    match: ['/settings/profile', '/settings/security', '/settings/notifications', '/settings/appearance', '/settings/account'],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const node = sidebarRef.current;
    if (!node) return;
    node.inert = !isDesktop && !mobileOpen;
  }, [isDesktop, mobileOpen]);

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
    cn('sidebar-link', active && 'sidebar-link--active', collapsed && 'justify-center');

  const nav = (
    <>
      <div className="flex items-center h-14 px-3 gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-on-primary" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight">PromoApp</span>
        )}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'icon-quiet ml-auto h-8 w-8 text-zinc-500 hidden lg:inline-flex',
            collapsed && 'absolute left-12 bg-zinc-900'
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
            const isActive = item.match.some((path) => location.pathname.startsWith(path));
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
        <MenuTrigger placement="top start">
          <Button
            variant="ghost"
            data-testid="account-menu"
            aria-label="Account menu"
            className={cn(
              'w-full h-auto py-1.5 px-2 justify-start text-left font-normal',
              collapsed && 'justify-center px-0'
            )}
          >
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              className="w-8 h-8 shrink-0"
              textClassName="text-xs"
            />
            {!collapsed && (
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-medium truncate text-zinc-100">{user?.name}</span>
                <span className="block text-xs text-zinc-500 truncate">{user?.email}</span>
              </span>
            )}
          </Button>
          <Menu aria-label="Account" className="min-w-56">
            <MenuItem isDisabled textValue={user?.email || 'Account'} className="opacity-100 cursor-default">
              <div className="min-w-0 py-0.5">
                <p className="text-sm font-medium truncate text-zinc-50">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </MenuItem>
            <MenuSeparator />
            <MenuItem textValue="Account Settings" onAction={() => navigate('/settings/profile')}>
              <User className="w-4 h-4 text-primary-400 shrink-0" />
              Account Settings
            </MenuItem>
            <MenuItem textValue="Appearance" onAction={() => navigate('/settings/appearance')}>
              <Palette className="w-4 h-4 text-primary-400 shrink-0" />
              Appearance
            </MenuItem>
            <MenuItem textValue="Workspace Settings" onAction={() => navigate('/settings/general')}>
              <Trophy className="w-4 h-4 text-primary-400 shrink-0" />
              Workspace Settings
            </MenuItem>
            <MenuSeparator />
            <MenuItem textValue="Log out" className="text-red-400" onAction={() => void handleLogout()}>
              <LogOut className="w-4 h-4 shrink-0" />
              <span data-testid="logout">Log out</span>
            </MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-zinc-900 border border-zinc-800 min-h-10 min-w-10"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        aria-controls="app-sidebar"
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon className="w-5 h-5" />
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 ui-modal-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        aria-hidden={isDesktop ? undefined : !mobileOpen}
        className={cn(
          'flex flex-col h-screen bg-background border-r border-border/80 transition-all duration-200 z-50 overflow-visible',
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
