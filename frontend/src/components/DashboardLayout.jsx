import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      <Sidebar />
      <main className="md:pl-16 lg:pl-60 pb-20 md:pb-0 min-h-screen transition-[padding] duration-200">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
