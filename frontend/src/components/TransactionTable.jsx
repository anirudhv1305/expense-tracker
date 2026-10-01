import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Search, Trash2 } from 'lucide-react';
import { currency, transactionDate } from '../lib/utils';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';
import { Button } from './ui/Button';
import { Card, CardTitle } from './ui/Card';

export default function TransactionTable({ transactions = [], categories = [], onDeleted }) {
  const { lookups } = useApp();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
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
  const [actionError, setActionError] = useState('');

  const filtered = useMemo(() => transactions.filter((tx) => {
    const haystack = `${tx.description} ${tx.category || ''} ${tx.subCategory || ''} ${tx.creditSubCategory || ''} ${tx.creditSource || ''} ${tx.amount}`.toLowerCase();
    const txDate = tx.occurredAt.slice(0, 10);
    const amount = Number(tx.amount);
    return (type === 'ALL' || tx.type === type)
      && (category === 'ALL' || tx.category === category)
      && (!from || txDate >= from)
      && (!to || txDate <= to)
      && (!minAmount || amount >= Number(minAmount))
      && (!maxAmount || amount <= Number(maxAmount))
      && haystack.includes(query.toLowerCase());
  }).sort((a, b) => {
    const difference = new Date(a.occurredAt) - new Date(b.occurredAt);
    return sortOrder === 'NEWEST' ? -difference : difference;
  }), [transactions, query, type, sortOrder, category, from, to, minAmount, maxAmount]);
  const activeFilterCount = [category !== 'ALL', Boolean(from), Boolean(to), Boolean(minAmount), Boolean(maxAmount)].filter(Boolean).length;

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      onDeleted?.();
    } catch (error) {
      setActionError(error.message || 'Could not reach Supabase. The transaction was not deleted.');
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
      subCategoryId: lookups.categoryTree.find((item) => item.name === tx.category)?.subCategories?.find((item) => item.name === tx.subCategory)?.id || '',
      creditSubCategoryId: lookups.creditSources.find((item) => item.name === tx.creditSource)?.subCategories?.find((item) => item.name === tx.creditSubCategory)?.id || ''
    });
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editTarget || !editForm) return;
    const payload = {
      ...editForm,
      amount: Number(editForm.amount),
      categoryId: editForm.type === 'DEBIT' ? editForm.categoryId : null,
      creditSourceId: editForm.type === 'CREDIT' ? editForm.creditSourceId : null,
      subCategory: null,
      subCategoryId: editForm.type === 'DEBIT' ? editForm.subCategoryId || null : null,
      creditSubCategoryId: editForm.type === 'CREDIT' ? editForm.creditSubCategoryId || null : null
    };
    setSavingEdit(true);
    setActionError('');
    try {
      await client.updateTransaction(editTarget.id, payload);
      setEditTarget(null);
      setEditForm(null);
      onDeleted?.();
    } catch (error) {
      setActionError(error.message || 'Could not reach Supabase. The transaction was not updated.');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <Card>
      {actionError && <p role="alert" className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p>}
      <div className="mb-4">
        <CardTitle>Complete Transaction History</CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_10rem]">
          <label className="col-span-2 flex h-11 min-w-0 items-center gap-2 rounded-md border bg-card px-3 sm:col-span-1">
            <Search size={18} className="shrink-0" />
            <input className="w-full min-w-0 bg-transparent outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions" />
          </label>
          <select aria-label="Transaction type" className="h-11 min-w-0 rounded-md border bg-card px-3" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All types</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
          <select aria-label="Sort order" className="h-11 min-w-0 rounded-md border bg-card px-3" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </div>
        <details className="group mt-3 rounded-md border bg-card/50 px-3">
          <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium marker:hidden">
            <span>More filters{activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ''}</span>
            <ChevronDown size={16} className="text-foreground/50 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-4">
            <select aria-label="Filter by category" className="col-span-2 h-11 min-w-0 rounded-md border bg-card px-3 sm:col-span-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="ALL">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
            <input aria-label="From date" className="h-11 min-w-0 w-full rounded-md border bg-card px-3" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input aria-label="To date" className="h-11 min-w-0 w-full rounded-md border bg-card px-3" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <input aria-label="Minimum amount" className="h-11 min-w-0 w-full rounded-md border bg-card px-3" type="number" step="0.01" inputMode="decimal" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <input aria-label="Maximum amount" className="h-11 min-w-0 w-full rounded-md border bg-card px-3" type="number" step="0.01" inputMode="decimal" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
        </details>
      </div>
      <div className="space-y-3 md:hidden">
        {filtered.map((tx) => (
          <article key={tx.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate font-semibold">{tx.description}</p><p className="mt-1 text-xs text-foreground/55">{transactionDate(tx.occurredAt)} · {tx.category || tx.creditSource}{tx.subCategory || tx.creditSubCategory ? ` · ${tx.subCategory || tx.creditSubCategory}` : ''}</p></div>
              <p className={`shrink-0 font-semibold ${tx.type === 'CREDIT' ? 'text-success' : 'text-destructive'}`}>{tx.type === 'CREDIT' ? '+' : '−'}{currency(tx.amount)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-2"><span className="text-xs text-foreground/55">Balance {currency(tx.balanceAfterTransaction)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" title="Edit transaction" onClick={() => openEdit(tx)}><Pencil size={16} /></Button><Button variant="ghost" size="icon" title="Delete transaction" onClick={() => setDeleteTarget(tx)}><Trash2 size={16} className="text-destructive" /></Button></div></div>
          </article>
        ))}
        {!filtered.length && <p className="rounded-xl border p-5 text-sm text-foreground/55">No transactions match these filters.</p>}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
                <td className="py-3">{transactionDate(tx.occurredAt)}</td>
                <td>{transactionDate(tx.occurredAt, { hour: '2-digit', minute: '2-digit' })}</td>
                <td className={tx.type === 'CREDIT' ? 'text-success' : 'text-destructive'}>{tx.type}</td>
                <td>{tx.category || tx.creditSource}</td>
                <td>{tx.subCategory || tx.creditSubCategory || '-'}</td>
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
              <ConfirmRow label="Date" value={transactionDate(deleteTarget.occurredAt, { day: '2-digit', month: 'long', year: 'numeric' })} />
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
                  <select required className="h-11 rounded-md border bg-card px-3" value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value, subCategoryId: '' })}>
                    <option value="">Select category</option>
                    {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {lookups.categoryTree.find((item) => item.id === editForm.categoryId)?.subCategories?.some((item) => item.active) && <select className="h-11 rounded-md border bg-card px-3" value={editForm.subCategoryId} onChange={(e) => setEditForm({ ...editForm, subCategoryId: e.target.value })}>
                    <option value="">No subcategory</option>
                    {lookups.categoryTree.find((item) => item.id === editForm.categoryId).subCategories.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>}
                </>
              ) : (
                <>
                  <select required aria-label="Credit source" className="h-11 rounded-md border bg-card px-3" value={editForm.creditSourceId} onChange={(e) => setEditForm({ ...editForm, creditSourceId: e.target.value, creditSubCategoryId: '' })}>
                    <option value="">Select source</option>
                    {lookups.creditSources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {lookups.creditSources.find((item) => item.id === editForm.creditSourceId)?.subCategories?.length > 0 && <select aria-label="Credit subcategory" className="h-11 rounded-md border bg-card px-3" value={editForm.creditSubCategoryId} onChange={(e) => setEditForm({ ...editForm, creditSubCategoryId: e.target.value })}>
                    <option value="">No subcategory</option>
                    {lookups.creditSources.find((item) => item.id === editForm.creditSourceId).subCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>}
                </>
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
