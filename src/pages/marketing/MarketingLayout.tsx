import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Trophy, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/product-integrations', label: 'Integrations' },
  { to: '/help', label: 'Help' },
  { to: '/developers', label: 'Developers' },
];

const footerColumns = [
  {
    title: 'Product',
    items: [
      { to: '/features', label: 'Features' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/product-integrations', label: 'Integrations' },
      { to: '/developers', label: 'Developers' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/help', label: 'Help Centre' },
      { to: '/changelog', label: 'Changelog' },
      { to: '/developers', label: 'Documentation' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
    ],
  },
];

export function MarketingLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="marketing-shell min-h-screen bg-white text-[#0B1020] overflow-x-hidden" style={{ colorScheme: 'light' }}>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-transparent supports-[backdrop-filter]:bg-white/80 data-[scrolled]:border-[#E8EAF0] h-[68px] flex items-center border-[#E8EAF0]/80">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg shrink-0 tracking-tight text-[#0B1020]">
            <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </span>
            PromoApp
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#667085]" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'text-[#0B1020] font-medium' : 'hover:text-[#0B1020] transition-colors'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="marketing-btn-primary text-sm px-3.5 py-2">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm text-[#667085] hover:text-[#0B1020] px-3 py-2 transition-colors"
                >
                  Log in
                </Link>
                <Link to="/register" className="marketing-btn-primary text-sm px-3.5 py-2">
                  Start free
                </Link>
              </>
            )}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-[#667085] hover:text-[#0B1020] hover:bg-[#F6F7F9]"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <nav className="md:hidden border-b border-[#E8EAF0] bg-white px-4 py-3 space-y-1" aria-label="Mobile">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? 'bg-[#F6F7F9] text-[#0B1020] font-medium' : 'text-[#667085] hover:text-[#0B1020] hover:bg-[#FAFAFC]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {!isAuthenticated && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-[#667085] hover:text-[#0B1020] hover:bg-[#FAFAFC] sm:hidden"
            >
              Log in
            </Link>
          )}
        </nav>
      )}

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[#E8EAF0] bg-[#FAFAFC]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-12 min-w-0">
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-[#0B1020]">
                <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </span>
                PromoApp
              </Link>
              <p className="text-[0.95rem] text-[#667085] mt-4 leading-relaxed max-w-xs">
                Hosted giveaways for brands that need referrals, embeds, analytics, and fair winner draws in one
                product.
              </p>
            </div>
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-[#0B1020] mb-4">{column.title}</p>
                <ul className="space-y-2.5 text-sm text-[#667085]">
                  {column.items.map((item) => (
                    <li key={`${column.title}-${item.to}-${item.label}`}>
                      <Link to={item.to} className="hover:text-[#0B1020] transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-7 border-t border-[#E8EAF0] flex flex-col sm:flex-row gap-3 justify-between text-sm text-[#667085]">
            <p>© {new Date().getFullYear()} PromoApp</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to="/terms" className="hover:text-[#0B1020]">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-[#0B1020]">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
