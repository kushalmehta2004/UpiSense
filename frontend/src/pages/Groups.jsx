import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { groups as groupsApi } from '../utils/api';

export function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    groupsApi
      .list()
      .then(({ data }) => {
        setGroups(data.groups || []);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load groups'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    groupsApi
      .create(newName.trim())
      .then(() => {
        setNewName('');
        setShowCreate(false);
        load();
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to create group'))
      .finally(() => setCreating(false));
  };

  const handleDelete = (g) => {
    if (!window.confirm(`Delete group "${g.name}"? This cannot be undone.`)) return;
    setDeletingId(g.id);
    groupsApi
      .delete(g.id)
      .then(() => load())
      .catch((err) => setError(err.response?.data?.error || 'Failed to delete'))
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Expense Groups</h1>
        <p className="text-slate-600 mb-6">
          Create and manage groups here or on WhatsApp. Add expenses on WhatsApp; view balances here.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-[#00a651] text-white rounded-lg hover:bg-[#008f45] transition-colors"
          >
            {showCreate ? 'Cancel' : '+ Create group'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name (e.g. Apartment)"
              className="px-3 py-2 border border-slate-300 rounded-lg min-w-[200px]"
              autoFocus
            />
            <button type="submit" disabled={creating || !newName.trim()} className="px-4 py-2 bg-[#00a651] text-white rounded-lg disabled:opacity-50">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        )}

        {loading && <p className="text-slate-500">Loading groups...</p>}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && groups.length === 0 && !showCreate && (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-600">
            <p>You don&apos;t have any groups yet.</p>
            <p className="mt-2 text-sm">Click &quot;Create group&quot; above or send <em>create group Apartment</em> on WhatsApp.</p>
          </div>
        )}
        {!loading && !error && groups.length > 0 && (
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                <Link to={`/groups/${g.id}`} className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-800">{g.name}</span>
                  <span className="text-slate-500 text-sm ml-2">→ Balance & expenses</span>
                </Link>
                {g.isCreator && (
                  <button
                    type="button"
                    onClick={() => handleDelete(g)}
                    disabled={deletingId === g.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {deletingId === g.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
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
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [youOwe, setYouOwe] = useState([]);
  const [owedToYou, setOwedToYou] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    groupsApi
      .get(id)
      .then(({ data }) => {
        setGroup(data.group);
        setMembers(data.members || []);
        setYouOwe(data.youOwe || []);
        setOwedToYou(data.owedToYou || []);
        setExpenses(data.expenses || []);
        setNewName(data.group?.name || '');
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load group'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === group?.name) {
      setEditName(false);
      return;
    }
    setSaving(true);
    groupsApi
      .update(id, newName.trim())
      .then(() => {
        setGroup((g) => (g ? { ...g, name: newName.trim() } : g));
        setEditName(false);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to update'))
      .finally(() => setSaving(false));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    const digits = addPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10+ digit phone number');
      return;
    }
    setAdding(true);
    setError(null);
    groupsApi
      .addMember(id, digits)
      .then(({ data }) => {
        setMembers(data.members || []);
        setAddPhone('');
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to add member'))
      .finally(() => setAdding(false));
  };

  const handleRemoveMember = (member) => {
    if (!window.confirm(`Remove ${member.name} (${member.phone}) from the group?`)) return;
    setRemovingId(member.id);
    groupsApi
      .removeMember(id, member.id)
      .then(({ data }) => setMembers(data.members || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to remove'))
      .finally(() => setRemovingId(null));
  };

  const handleDeleteGroup = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    groupsApi
      .delete(id)
      .then(() => navigate('/groups'))
      .catch((err) => setError(err.response?.data?.error || 'Failed to delete'));
  };

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
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {editName ? (
                <form onSubmit={handleUpdateName} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                    autoFocus
                  />
                  <button type="submit" disabled={saving} className="px-3 py-2 bg-[#00a651] text-white rounded-lg text-sm">Save</button>
                  <button type="button" onClick={() => { setEditName(false); setNewName(group.name); }} className="px-3 py-2 text-slate-600 text-sm">Cancel</button>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
                  {group.isCreator && (
                    <button
                      type="button"
                      onClick={() => setEditName(true)}
                      className="text-sm text-slate-500 hover:text-[#00a651]"
                    >
                      Edit name
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Members */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Members</h2>
              <ul className="space-y-2 mb-4">
                {members.map((m) => (
                  <li key={m.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-800">{m.name}</span>
                    <span className="text-slate-500 text-sm">{m.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m)}
                      disabled={removingId === m.id}
                      className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded disabled:opacity-50"
                    >
                      {removingId === m.id ? '…' : group.isCreator ? 'Remove' : 'Leave'}
                    </button>
                  </li>
                ))}
              </ul>
              {group.isCreator && (
                <form onSubmit={handleAddMember} className="flex flex-wrap gap-2 items-center">
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="Phone (10+ digits)"
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <button type="submit" disabled={adding} className="px-4 py-2 bg-[#00a651] text-white rounded-lg text-sm disabled:opacity-50">
                    {adding ? 'Adding…' : 'Add member'}
                  </button>
                </form>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-sm font-medium text-amber-800 mb-1">You owe</h3>
                <p className="text-xl font-bold text-amber-900">₹{totalOwe.toLocaleString('en-IN')}</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {youOwe.map((o) => (
                    <li key={o.userId}>{o.name}: ₹{o.amount.toLocaleString('en-IN')}</li>
                  ))}
                  {youOwe.length === 0 && <li className="text-amber-600">All clear</li>}
                </ul>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="text-sm font-medium text-emerald-800 mb-1">You&apos;re owed</h3>
                <p className="text-xl font-bold text-emerald-900">₹{totalOwed.toLocaleString('en-IN')}</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {owedToYou.map((o) => (
                    <li key={o.userId}>{o.name}: ₹{o.amount.toLocaleString('en-IN')}</li>
                  ))}
                  {owedToYou.length === 0 && <li className="text-emerald-600">Nothing</li>}
                </ul>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-slate-500">No expenses yet. Add them on WhatsApp: <em>expense 500 dinner in {group.name}</em></p>
              ) : (
                <ul className="space-y-2">
                  {expenses.map((e) => (
                    <li key={e.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                      <div>
                        <span className="font-medium text-slate-800">{e.description}</span>
                        <span className="text-slate-500 text-sm ml-2">by {e.paid_by_name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {group.isCreator && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  className={`px-4 py-2 rounded-lg text-sm ${deleteConfirm ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'}`}
                >
                  {deleteConfirm ? 'Click again to confirm delete group' : 'Delete group'}
                </button>
                {deleteConfirm && (
                  <button type="button" onClick={() => setDeleteConfirm(false)} className="ml-3 text-slate-600 text-sm">
                    Cancel
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
