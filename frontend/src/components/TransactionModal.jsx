import { useState } from 'react';
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
    subCategory: ''
  });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      amount: Number(form.amount),
      categoryId: form.type === 'DEBIT' ? form.categoryId : null,
      creditSourceId: form.type === 'CREDIT' ? form.creditSourceId : null,
      subCategory: form.type === 'DEBIT' && selectedCategory?.name === 'Outings' ? form.subCategory : null
    };
    await client.createTransaction(payload);
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  const selectedCategory = lookups.categories.find((item) => item.id === form.categoryId);

  return (
    <>
      <Button className="fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full shadow-glass" size="icon" onClick={() => setOpen(true)} aria-label="Add transaction">
        <Plus />
      </Button>
      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
          <form onSubmit={submit} className="glass w-full max-w-lg rounded-lg border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}><X size={18} /></Button>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
                {['DEBIT', 'CREDIT'].map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${form.type === type ? 'bg-card shadow-sm' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, type }))}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input required min="0.01" step="0.01" type="number" placeholder="Amount" className="h-11 rounded-md border bg-card px-3" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input required type="date" className="h-11 rounded-md border bg-card px-3" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <input required maxLength={180} placeholder="Description" className="h-11 rounded-md border bg-card px-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {form.type === 'DEBIT' ? (
                <>
                  <select required className="h-11 rounded-md border bg-card px-3" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Select category</option>
                    {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {selectedCategory?.name === 'Outings' && (
                    <select required className="h-11 rounded-md border bg-card px-3" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })}>
                      <option value="">Select sub category</option>
                      <option value="Friend">Friend</option>
                      <option value="Girlfriend">Girlfriend</option>
                    </select>
                  )}
                </>
              ) : (
                <select required className="h-11 rounded-md border bg-card px-3" value={form.creditSourceId} onChange={(e) => setForm({ ...form, creditSourceId: e.target.value })}>
                  <option value="">Select source</option>
                  {lookups.creditSources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              )}
              <Button disabled={saving}>{saving ? 'Saving...' : 'Save Transaction'}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
