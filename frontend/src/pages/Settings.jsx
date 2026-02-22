import { Header } from '../components/Header';
import { useAuthStore } from '../hooks/useAuth';

export function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-500">Phone</label>
            <p className="text-slate-800 font-medium">{user?.phone || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Name</label>
            <p className="text-slate-800 font-medium">{user?.name || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Plan</label>
            <p className="text-slate-800 font-medium capitalize">{user?.plan || 'free'}</p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-medium text-slate-800 mb-2">How it works</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
              <li>Forward your UPI payment messages to the UpiSense WhatsApp number</li>
              <li>Transactions are parsed and categorized automatically</li>
              <li>View insights and trends on this dashboard</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
