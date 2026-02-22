import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { groups as groupsApi } from '../utils/api';

export function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    groupsApi
      .list()
      .then(({ data }) => {
        setGroups(data.groups || []);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Expense Groups</h1>
        <p className="text-slate-600 mb-6">
          Create groups on WhatsApp and add expenses. Here you can see balances and who owes whom.
        </p>

        {loading && <p className="text-slate-500">Loading groups...</p>}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && groups.length === 0 && (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-600">
            <p>You don&apos;t have any groups yet.</p>
            <p className="mt-2 text-sm">Create one on WhatsApp: send <em>create group Apartment</em> to the bot.</p>
          </div>
        )}
        {!loading && !error && groups.length > 0 && (
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/groups/${g.id}`}
                  className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00a651] hover:shadow-md transition-all"
                >
                  <span className="font-semibold text-slate-800">{g.name}</span>
                  <span className="text-slate-500 text-sm ml-2">→ View balance & expenses</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [youOwe, setYouOwe] = useState([]);
  const [owedToYou, setOwedToYou] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    groupsApi
      .get(id)
      .then(({ data }) => {
        setGroup(data.group);
        setYouOwe(data.youOwe || []);
        setOwedToYou(data.owedToYou || []);
        setExpenses(data.expenses || []);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load group'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalOwe = youOwe.reduce((s, o) => s + o.amount, 0);
  const totalOwed = owedToYou.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/groups" className="text-[#00a651] hover:underline text-sm mb-4 inline-block">
          ← Back to groups
        </Link>

        {loading && <p className="text-slate-500">Loading...</p>}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && group && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">{group.name}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-sm font-medium text-amber-800 mb-1">You owe</h3>
                <p className="text-xl font-bold text-amber-900">₹{totalOwe.toLocaleString('en-IN')}</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {youOwe.map((o) => (
                    <li key={o.userId}>
                      {o.name}: ₹{o.amount.toLocaleString('en-IN')}
                    </li>
                  ))}
                  {youOwe.length === 0 && <li className="text-amber-600">All clear</li>}
                </ul>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="text-sm font-medium text-emerald-800 mb-1">You&apos;re owed</h3>
                <p className="text-xl font-bold text-emerald-900">₹{totalOwed.toLocaleString('en-IN')}</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {owedToYou.map((o) => (
                    <li key={o.userId}>
                      {o.name}: ₹{o.amount.toLocaleString('en-IN')}
                    </li>
                  ))}
                  {owedToYou.length === 0 && <li className="text-emerald-600">Nothing</li>}
                </ul>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-slate-500">No expenses yet.</p>
              ) : (
                <ul className="space-y-2">
                  {expenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div>
                        <span className="font-medium text-slate-800">{e.description}</span>
                        <span className="text-slate-500 text-sm ml-2">by {e.paid_by_name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(e.amount).toLocaleString('en-IN')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
