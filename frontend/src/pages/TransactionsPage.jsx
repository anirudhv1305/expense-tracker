import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Layout from '../components/Layout';
import TransactionTable from '../components/TransactionTable';
import { Button } from '../components/ui/Button';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';
import { monthLabel } from '../lib/utils';

export default function TransactionsPage() {
  const { lookups } = useApp();
  const [history, setHistory] = useState([]);
  const [monthId, setMonthId] = useState('');
  const monthIdRef = useRef('');
  const [month, setMonth] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const transactions = Array.isArray(month?.transactions) ? month.transactions : [];

  const load = useCallback(async (selectedId) => {
    setError('');
    try {
      const months = await client.history();
      setHistory(months);
      const targetId = selectedId || monthIdRef.current || months[0]?.id;
      monthIdRef.current = targetId || '';
      setMonthId(targetId || '');
      setMonth(targetId ? await client.month(targetId) : null);
    } catch (cause) {
      console.error('Failed to load transactions:', cause);
      setError('Could not load transactions. Check your connection and retry.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const selectMonth = (event) => { setLoading(true); load(event.target.value); };

  return <Layout history={history}>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-primary">Your activity</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Transactions</h1><p className="mt-1 text-sm text-foreground/55">Search, sort and review your income and spending.</p></div>
      {history.length > 0 && <label className="grid gap-1.5 text-xs font-semibold text-foreground/55">Tracking month<select aria-label="Select transaction month" value={monthId} onChange={selectMonth} className="h-11 min-w-48 rounded-xl border bg-card px-3 text-sm font-medium text-foreground">{history.map((item) => <option key={item.id} value={item.id}>{monthLabel(item.month, item.year)}</option>)}</select></label>}
    </header>
    {error && <div role="alert" className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button className="ml-3" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button></div>}
    {loading ? <div className="space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-muted"/><div className="h-64 animate-pulse rounded-2xl bg-muted"/></div>
      : month ? <><div className="mb-4 flex items-center gap-2 text-sm text-foreground/55"><ArrowRightLeft size={16}/>{transactions.length} transactions in {monthLabel(month.month.month, month.month.year)}</div><TransactionTable transactions={transactions} categories={lookups.categories} onDeleted={() => load(monthId)} /></>
        : <div className="rounded-3xl border bg-card px-5 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-foreground/50"><ArrowRightLeft size={24}/></span><h2 className="mt-4 text-lg font-semibold">No transaction history yet</h2><p className="mx-auto mt-1 max-w-sm text-sm text-foreground/55">When you record your first income or expense, it will appear here.</p></div>}
  </Layout>;
}
