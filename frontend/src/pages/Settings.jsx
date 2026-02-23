import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuthStore } from '../hooks/useAuth';
import { auth } from '../utils/api';

export function Settings() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user?.name !== undefined) {
      setName(user.name || '');
      setLoaded(true);
    }
  }, [user?.name]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const { data } = await auth.updateProfile({ name: name.trim() || undefined });
      if (data?.user) {
        updateUser(data.user);
        setMessage('Profile updated.');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name?.trim() || null;
  const displayPhone = user?.phone || user?.whatsapp_number || '—';
  const displayWhatsApp = user?.whatsapp_number && user.whatsapp_number !== user?.phone ? user.whatsapp_number : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="p-6 space-y-6">
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
                  maxLength={255}
                />
              </div>
              {message && (
                <p className={`text-sm ${message === 'Profile updated.' ? 'text-teal-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={saving || !loaded}
                className="px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Saving…' : 'Save name'}
              </button>
            </form>

            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500">Phone</label>
                <p className="text-slate-800 font-medium mt-0.5">{displayPhone}</p>
              </div>
              {displayWhatsApp && (
                <div>
                  <label className="block text-sm font-medium text-slate-500">WhatsApp number</label>
                  <p className="text-slate-800 font-medium mt-0.5">{displayWhatsApp}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-500">Plan</label>
                <p className="text-slate-800 font-medium mt-0.5 capitalize">{user?.plan || 'free'}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
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
