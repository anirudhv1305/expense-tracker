import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';
import { Button } from './ui/Button';

export default function TransactionModal({ onSaved }) {
  const { lookups } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'DEBIT',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    categoryId: '',
    creditSourceId: '',
    subCategoryId: '',
    creditSubCategoryId: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const amountRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    const manageDialogKeys = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', manageDialogKeys);
    requestAnimationFrame(() => amountRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', manageDialogKeys);
      trigger?.focus();
    };
  }, [open]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      amount: Number(form.amount),
      categoryId: form.type === 'DEBIT' ? form.categoryId : null,
      creditSourceId: form.type === 'CREDIT' ? form.creditSourceId : null,
      subCategory: null,
      subCategoryId: form.type === 'DEBIT' ? form.subCategoryId || null : null,
      creditSubCategoryId: form.type === 'CREDIT' ? form.creditSubCategoryId || null : null
    };
    try {
      await client.createTransaction(payload);
      setSaving(false);
      setOpen(false);
      setForm({ type: 'DEBIT', amount: '', date: new Date().toISOString().slice(0, 10), description: '', categoryId: '', creditSourceId: '', subCategoryId: '', creditSubCategoryId: '' });
      onSaved();
    } catch (e) {
      setError(e.message?.toLowerCase().includes('fetch') || e.message?.toLowerCase().includes('network')
        ? 'Could not reach Supabase. This transaction was not saved; reconnect and try again.'
        : e.message || 'Could not save transaction. Check the details and try again.');
      setSaving(false);
    }
  }

  const selectedCategory = lookups.categoryTree.find((item) => item.id === form.categoryId);
  const selectedCreditSource = lookups.creditSources.find((item) => item.id === form.creditSourceId);

  return (
    <>
      <Button ref={triggerRef} className="fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom))] right-4 z-20 h-12 rounded-full px-5 shadow-lg shadow-primary/20 sm:bottom-6 sm:right-6" onClick={() => setOpen(true)} aria-label="Add transaction">
        <Plus size={19} /> <span>Add transaction</span>
      </Button>
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-0 min-w-0 items-center justify-center overflow-hidden bg-black/50 p-2 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}>
          <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" onSubmit={submit} className="glass flex h-full max-h-full min-h-0 w-full min-w-0 max-w-lg flex-col overflow-x-hidden overflow-y-hidden rounded-[1.7rem] border shadow-2xl sm:h-auto sm:max-h-[88dvh]">
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-7 sm:py-5">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">New entry</p><h2 id="transaction-modal-title" className="mt-1 text-xl font-bold">Add transaction</h2></div>
              <Button type="button" variant="ghost" size="icon" disabled={saving} onClick={() => setOpen(false)} aria-label="Close transaction form"><X size={18} /></Button>
            </div>
            <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
              <label className="grid min-w-0 gap-2 text-sm font-semibold">Amount<input ref={amountRef} required min="0.01" step="0.01" type="number" inputMode="decimal" placeholder="₹ 0.00" className="h-[72px] w-full min-w-0 max-w-full rounded-2xl border bg-background px-4 text-3xl font-bold tracking-tight" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                {['DEBIT', 'CREDIT'].map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`min-h-12 rounded-xl px-3 py-2 text-sm font-medium ${form.type === type ? 'bg-card shadow-sm' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, type, categoryId: '', creditSourceId: '', subCategoryId: '', creditSubCategoryId: '' }))}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <label className="grid min-w-0 gap-2 text-sm font-medium">Date<input required type="date" className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              <label className="grid min-w-0 gap-2 text-sm font-medium">Description<input required maxLength={180} placeholder="What was this for?" className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              {form.type === 'DEBIT' ? (
                <>
                  <label className="grid min-w-0 gap-2 text-sm font-medium">Category<select required className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, subCategoryId: '' })}>
                    <option value="">Select category</option>
                    {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select></label>
                  {selectedCategory?.subCategories?.some((item) => item.active) && (
                    <label className="grid min-w-0 gap-2 text-sm font-medium">Subcategory<select required className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.subCategoryId} onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })}>
                      <option value="">Select subcategory</option>
                      {selectedCategory.subCategories.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select></label>
                  )}
                </>
              ) : (
                <>
                  <label className="grid min-w-0 gap-2 text-sm font-medium">Credit source<select required className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.creditSourceId} onChange={(e) => setForm({ ...form, creditSourceId: e.target.value, creditSubCategoryId: '' })}>
                    <option value="">Select source</option>
                    {lookups.creditSources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select></label>
                  {selectedCreditSource?.subCategories?.length > 0 && <label className="grid min-w-0 gap-2 text-sm font-medium">Subcategory (optional)<select className="h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-3" value={form.creditSubCategoryId} onChange={(e) => setForm({ ...form, creditSubCategoryId: e.target.value })}>
                    <option value="">No subcategory</option>
                    {selectedCreditSource.subCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select></label>}
                </>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="shrink-0 border-t bg-card px-5 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:rounded-b-[1.7rem] sm:px-7 sm:py-4">
              <Button disabled={saving} className="min-h-12 w-full">{saving ? 'Saving...' : 'Save transaction'}</Button>
            </div>
          </form>
        </div>, document.body
      )}
    </>
  );
}
