import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../hooks/useAuth';
import { LayoutDashboard, ArrowLeftRight, Users, Settings, LogOut } from 'lucide-react';

const MINT = '#00D4A0';
const DARK = '#0A0F1E';
const SIDEBAR_BG = '#0D1117';
const TEXT = '#F9FAFB';
const MUTED = '#6B7280';
const HOVER_BG = 'rgba(255,255,255,0.04)';
const ACTIVE_BG = 'rgba(0,212,160,0.08)';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { path: '/debts', label: 'Debts', Icon: Users },
  { path: '/settings', label: 'Settings', Icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [logoSrc, setLogoSrc] = useState('/logo.png');
  const firstName = user?.name?.split(/\s+/)[0] || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop/tablet sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden md:flex flex-col h-screen w-16 lg:w-60 border-r transition-[width] duration-200"
        style={{ background: SIDEBAR_BG, borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="p-4 lg:p-5 flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <img
              src={logoSrc}
              alt="UpiSense"
              className="h-9 w-9 shrink-0 object-contain"
              onError={() => setLogoSrc('/logo.svg')}
            />
            <span className="text-lg font-bold truncate hidden lg:inline" style={{ color: TEXT }}>UpiSense</span>
          </Link>
        </div>
        <p className="px-4 lg:px-5 pb-3 text-xs hidden lg:block" style={{ color: MUTED }}>
          Hey, {firstName} 👋
        </p>
        <nav className="flex-1 flex flex-col gap-0.5 px-2 lg:px-3">
          {navItems.map(({ path, label, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
                style={{
                  background: isActive ? ACTIVE_BG : 'transparent',
                  color: isActive ? MINT : MUTED,
                  borderLeft: isActive ? `3px solid ${MINT}` : '3px solid transparent',
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-2 lg:p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400"
            style={{ color: MUTED }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around py-2 safe-area-pb"
        style={{ background: SIDEBAR_BG, borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {navItems.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] rounded-xl transition-colors"
              style={{ color: isActive ? MINT : MUTED }}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: MINT }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
