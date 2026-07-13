import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { currency, monthLabel } from '../lib/utils';
import { Button } from './ui/Button';

const colors = ['#2563eb', '#16a34a', '#dc2626', '#0891b2', '#7c3aed', '#ea580c', '#475569', '#db2777'];

export default function CategoryDetailsModal({ category, month, transactions = [], onClose }) {
  const [query, setQuery] = useState('');
  const [subFilter, setSubFilter] = useState('ALL');
  const categoryTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === 'DEBIT' && tx.category === category?.name),
    [transactions, category]
  );
  const total = categoryTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const subcategoryRows = useMemo(() => {
    const grouped = new Map();
    categoryTransactions.forEach((tx) => {
      if (!tx.subCategory) return;
      const current = grouped.get(tx.subCategory) || { name: tx.subCategory, amount: 0, transactions: [] };
      current.amount += Number(tx.amount || 0);
      current.transactions.push(tx);
      grouped.set(tx.subCategory, current);
    });
    return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
  }, [categoryTransactions]);
  const filteredTransactions = categoryTransactions.filter((tx) => {
    const haystack = `${tx.description} ${tx.subCategory || ''} ${tx.amount}`.toLowerCase();
    return (subFilter === 'ALL' || tx.subCategory === subFilter) && haystack.includes(query.toLowerCase());
  });
  const pieData = subcategoryRows.map((row) => ({ name: row.name, value: row.amount }));

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4 animate-in fade-in duration-150">
      <section className="glass flex max-h-[88vh] w-full max-w-[900px] flex-col rounded-lg border shadow-glass animate-in zoom-in-95 duration-150">
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-2xl font-semibold">{category.name}</h2>
            <p className="text-sm text-foreground/60">{month ? monthLabel(month.month, month.year) : 'Selected Month'}: {month?.startDate} to {month?.endDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close category details"><X size={18} /></Button>
        </header>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary label="Total spent" value={currency(total)} />
            <Summary label="Transactions" value={categoryTransactions.length} />
            <Summary label="Monthly expenses" value={`${category?.percentage || 0}%`} />
          </div>

          <section className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground/70">Subcategory Pie Chart</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={44}>
                      {pieData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => currency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-[260px] place-items-center text-sm text-foreground/50">No subcategories available.</div>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground/70">Subcategory Breakdown</h3>
              {subcategoryRows.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {subcategoryRows.map((row) => (
                    <button
                      key={row.name}
                      className="rounded-md border p-3 text-left hover:bg-muted"
                      onClick={() => setSubFilter(row.name)}
                    >
                      <p className="font-semibold">{row.name}</p>
                      <p className="mt-2 text-xl font-semibold">{currency(row.amount)}</p>
                      <p className="text-xs text-foreground/50">Transactions: {row.transactions.length}</p>
                      <p className="text-xs text-foreground/50">Percentage: {total ? Math.round((row.amount / total) * 100) : 0}%</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/50">No subcategories available.</p>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-lg border p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-foreground/70">Transactions</h3>
              <div className="flex flex-wrap gap-2">
                <label className="flex h-10 items-center gap-2 rounded-md border bg-card px-3">
                  <Search size={16} />
                  <input className="w-44 bg-transparent outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
                </label>
                <select className="h-10 rounded-md border bg-card px-3" value={subFilter} onChange={(e) => setSubFilter(e.target.value)}>
                  <option value="ALL">All subcategories</option>
                  {subcategoryRows.map((row) => <option key={row.name} value={row.name}>{row.name}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase text-foreground/50">
                  <tr>
                    <th className="py-3">Date</th>
                    <th>Sub Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Balance After Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3">{new Date(tx.occurredAt).toLocaleDateString('en-IN')}</td>
                      <td>{tx.subCategory || '-'}</td>
                      <td>{tx.description}</td>
                      <td className="text-right font-medium">{currency(tx.amount)}</td>
                      <td className="text-right">{currency(tx.balanceAfterTransaction)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-foreground/50">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
