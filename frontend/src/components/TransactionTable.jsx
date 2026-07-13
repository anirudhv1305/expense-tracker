import { useMemo, useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { currency } from '../lib/utils';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';
import { Button } from './ui/Button';
import { Card, CardTitle } from './ui/Card';

export default function TransactionTable({ transactions = [], categories = [], onDeleted }) {
  const { lookups } = useApp();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const filtered = useMemo(() => transactions.filter((tx) => {
    const haystack = `${tx.description} ${tx.category || ''} ${tx.subCategory || ''} ${tx.creditSource || ''} ${tx.amount}`.toLowerCase();
    const txDate = tx.occurredAt.slice(0, 10);
    const amount = Number(tx.amount);
    return (type === 'ALL' || tx.type === type)
      && (category === 'ALL' || tx.category === category)
      && (!from || txDate >= from)
      && (!to || txDate <= to)
      && (!minAmount || amount >= Number(minAmount))
      && (!maxAmount || amount <= Number(maxAmount))
      && haystack.includes(query.toLowerCase());
  }), [transactions, query, type, category, from, to, minAmount, maxAmount]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(tx) {
    const categoryId = lookups.categories.find((item) => item.name === tx.category)?.id || '';
    const creditSourceId = lookups.creditSources.find((item) => item.name === tx.creditSource)?.id || '';
    setEditTarget(tx);
    setEditForm({
      type: tx.type,
      amount: String(tx.amount),
      date: tx.occurredAt.slice(0, 10),
      description: tx.description,
      categoryId,
      creditSourceId,
      subCategory: tx.subCategory || ''
    });
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editTarget || !editForm) return;
    const selectedCategory = lookups.categories.find((item) => item.id === editForm.categoryId);
    const payload = {
      ...editForm,
      amount: Number(editForm.amount),
      categoryId: editForm.type === 'DEBIT' ? editForm.categoryId : null,
      creditSourceId: editForm.type === 'CREDIT' ? editForm.creditSourceId : null,
      subCategory: editForm.type === 'DEBIT' && selectedCategory?.name === 'Outings' ? editForm.subCategory : null
    };
    setSavingEdit(true);
    try {
      await client.updateTransaction(editTarget.id, payload);
      setEditTarget(null);
      setEditForm(null);
      onDeleted?.();
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Complete Transaction History</CardTitle>
        <div className="flex flex-wrap gap-2">
          <label className="flex h-10 items-center gap-2 rounded-md border bg-card px-3">
            <Search size={16} />
            <input className="w-44 bg-transparent outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
          </label>
          <select className="h-10 rounded-md border bg-card px-3" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
          <select className="h-10 rounded-md border bg-card px-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ALL">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <input className="h-10 rounded-md border bg-card px-3" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="h-10 rounded-md border bg-card px-3" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <input className="h-10 w-28 rounded-md border bg-card px-3" type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          <input className="h-10 w-28 rounded-md border bg-card px-3" type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="text-xs uppercase text-foreground/50">
            <tr>
              <th className="py-3">Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Category</th>
              <th>Sub Category</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td className="py-3">{new Date(tx.occurredAt).toLocaleDateString('en-IN')}</td>
                <td>{new Date(tx.occurredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className={tx.type === 'CREDIT' ? 'text-success' : 'text-destructive'}>{tx.type}</td>
                <td>{tx.category || tx.creditSource}</td>
                <td>{tx.subCategory || '-'}</td>
                <td>{tx.description}</td>
                <td className="text-right font-medium">{currency(tx.amount)}</td>
                <td className="text-right">{currency(tx.balanceAfterTransaction)}</td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(tx)}><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteTarget(tx)}><Trash2 size={15} className="text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 animate-in fade-in duration-150">
          <section className="glass w-full max-w-md rounded-lg border p-5 shadow-glass animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-semibold">Delete Transaction?</h2>
            <div className="mt-4 space-y-2 text-sm">
              <ConfirmRow label="Description" value={deleteTarget.description} />
              <ConfirmRow label="Amount" value={currency(deleteTarget.amount)} />
              <ConfirmRow label="Category" value={deleteTarget.category || deleteTarget.creditSource} />
              <ConfirmRow label="Date" value={new Date(deleteTarget.occurredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </section>
        </div>
      )}
      {editTarget && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 animate-in fade-in duration-150">
          <form onSubmit={submitEdit} className="glass w-full max-w-lg rounded-lg border p-5 shadow-glass animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-semibold">Edit Transaction</h2>
            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                {['DEBIT', 'CREDIT'].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${editForm.type === item ? 'bg-card shadow-sm' : ''}`}
                    onClick={() => setEditForm((form) => ({ ...form, type: item }))}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input required min="0.01" step="0.01" type="number" className="h-11 rounded-md border bg-card px-3" placeholder="Amount" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
              <input required type="date" className="h-11 rounded-md border bg-card px-3" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              <input required maxLength={180} className="h-11 rounded-md border bg-card px-3" placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              {editForm.type === 'DEBIT' ? (
                <>
                  <select required className="h-11 rounded-md border bg-card px-3" value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value, subCategory: '' })}>
                    <option value="">Select category</option>
                    {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {lookups.categories.find((item) => item.id === editForm.categoryId)?.name === 'Outings' && (
                    <select required className="h-11 rounded-md border bg-card px-3" value={editForm.subCategory} onChange={(e) => setEditForm({ ...editForm, subCategory: e.target.value })}>
                      <option value="">Select sub category</option>
                      <option value="Friend">Friend</option>
                      <option value="Girlfriend">Girlfriend</option>
                    </select>
                  )}
                </>
              ) : (
                <select required className="h-11 rounded-md border bg-card px-3" value={editForm.creditSourceId} onChange={(e) => setEditForm({ ...editForm, creditSourceId: e.target.value })}>
                  <option value="">Select source</option>
                  {lookups.creditSources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setEditTarget(null); setEditForm(null); }} disabled={savingEdit}>Cancel</Button>
              <Button disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-foreground/60">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
