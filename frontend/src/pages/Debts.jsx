import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { debts as debtsApi } from '../utils/api';

export function Debts() {
  const [owedToMe, setOwedToMe] = useState([]);
  const [iOwe, setIOwe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [owedRes, iOweRes] = await Promise.all([
          debtsApi.owedToMe(),
          debtsApi.iOwe(),
        ]);
        if (owedRes.data?.entries) setOwedToMe(owedRes.data.entries);
        if (iOweRes.data?.entries) setIOwe(iOweRes.data.entries);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load debts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalOwedToMe = owedToMe.reduce((s, e) => s + e.amount, 0);
  const totalIOwe = iOwe.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Debts (IOU)</h1>
        <p className="text-[#64748b] text-sm mb-6">
          Track who owes you and who you owe. Add entries via WhatsApp: e.g. <em>Samkit owes me 500</em> or <em>I owe Raj 300</em>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-[#64748b]">Loading…</div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-[#ecfdf5] border-b border-[#a7f3d0]">
                <h2 className="font-semibold text-[#065f46]">Who owes you</h2>
                <p className="text-sm text-[#047857] mt-0.5">
                  Total: ₹{totalOwedToMe.toLocaleString('en-IN')}
                </p>
              </div>
              <ul className="divide-y divide-[#f1f5f9]">
                {owedToMe.length === 0 ? (
                  <li className="px-4 py-6 text-[#64748b] text-sm">No one owes you anything right now.</li>
                ) : (
                  owedToMe.map((entry, i) => (
                    <li key={`${entry.person_name}-${i}`} className="flex justify-between items-center px-4 py-3">
                      <span className="font-medium text-[#0f172a]">{entry.person_name}</span>
                      <span className="text-[#059669] font-semibold">₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-[#fffbeb] border-b border-[#fde68a]">
                <h2 className="font-semibold text-[#92400e]">Who you owe</h2>
                <p className="text-sm text-[#b45309] mt-0.5">
                  Total: ₹{totalIOwe.toLocaleString('en-IN')}
                </p>
              </div>
              <ul className="divide-y divide-[#f1f5f9]">
                {iOwe.length === 0 ? (
                  <li className="px-4 py-6 text-[#64748b] text-sm">You don&apos;t owe anyone right now.</li>
                ) : (
                  iOwe.map((entry, i) => (
                    <li key={`${entry.person_name}-${i}`} className="flex justify-between items-center px-4 py-3">
                      <span className="font-medium text-[#0f172a]">{entry.person_name}</span>
                      <span className="text-amber-700 font-semibold">₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
