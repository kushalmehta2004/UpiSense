import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0F1E' }}>
      <Sidebar />
      <main className="md:pl-16 lg:pl-60 pb-20 md:pb-0 flex-1 transition-[padding] duration-200">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <footer className="py-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-center text-[11px] mb-2" style={{ color: '#374151' }}>
          AI categorization may not always be accurate. Verify against your bank statement.
        </p>
        <p className="text-center text-[11px]" style={{ color: '#374151' }}>
          <Link to="/privacy" className="hover:opacity-80">Privacy Policy</Link>
          <span className="mx-1">·</span>
          <Link to="/terms" className="hover:opacity-80">Terms of Service</Link>
          <span className="mx-1">·</span>
          <span>Not a financial advisor</span>
          <span className="mx-1">·</span>
          <span>Data stored in India</span>
        </p>
      </footer>
    </div>
  );
}
