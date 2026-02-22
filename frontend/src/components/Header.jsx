import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const navLinks = (
    <>
      <Link to="/" className="block py-2 sm:py-0 text-slate-600 hover:text-[#00a651] transition-colors" onClick={() => setMenuOpen(false)}>
        Dashboard
      </Link>
      <Link to="/transactions" className="block py-2 sm:py-0 text-slate-600 hover:text-[#00a651] transition-colors" onClick={() => setMenuOpen(false)}>
        Transactions
      </Link>
      <Link to="/groups" className="block py-2 sm:py-0 text-slate-600 hover:text-[#00a651] transition-colors" onClick={() => setMenuOpen(false)}>
        Groups
      </Link>
      <Link to="/settings" className="block py-2 sm:py-0 text-slate-600 hover:text-[#00a651] transition-colors" onClick={() => setMenuOpen(false)}>
        Settings
      </Link>
      {user && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
          <span className="text-sm text-slate-500">{user.phone}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-red-600 transition-colors text-left sm:text-center"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#00a651]">UpiSense</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {navLinks}
          </nav>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden py-4 space-y-1 border-t border-slate-100">
            {navLinks}
          </div>
        )}
      </div>
    </header>
  );
}
