import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { client } from '../services/api';
import { currency, monthLabel } from '../lib/utils';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => client.history().then((rows) => { setHistory(rows); setError(''); }).catch((cause) => setError(`Could not load your monthly history. ${cause.message || 'Check your connection and retry.'}`)).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  return <Layout history={history}>
    <header className="mb-7"><p className="text-sm font-medium text-primary">Your money over time</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Monthly history</h1><p className="mt-1 text-sm text-foreground/55">Review balances and cash flow from each month.</p></header>
    {error && <div role="alert" className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button className="ml-3" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button></div>}
    {loading ? <div className="space-y-3">{[0,1,2].map((x) => <div key={x} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      : history.length ? <div className="space-y-3">{history.map((month, index) => <Link key={month.id} to={`/months/${month.id}`} className="group block rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays size={20}/></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold tracking-tight">{monthLabel(month.month, month.year)}</h2>{index === 0 && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">Current</span>}</div><p className="mt-1 text-xs text-foreground/55">{month.transactionCount} {month.transactionCount === 1 ? 'transaction' : 'transactions'}</p></div>
          <div className="text-right"><p className="text-xs text-foreground/50">Closing balance</p><p className="mt-0.5 text-lg font-bold tabular-nums">{currency(month.closingBalance)}</p></div>
          <ArrowRight className="ml-1 text-foreground/35 transition group-hover:translate-x-1 group-hover:text-primary" size={18}/>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-3">
          <div><p className="flex items-center gap-1 text-[11px] text-foreground/50"><ArrowDownLeft size={13}/>Income</p><p className="mt-1 text-sm font-semibold tabular-nums text-success">{currency(month.totalCredits)}</p></div>
          <div><p className="flex items-center gap-1 text-[11px] text-foreground/50"><ArrowUpRight size={13}/>Expenses</p><p className="mt-1 text-sm font-semibold tabular-nums text-destructive">{currency(month.totalDebits)}</p></div>
          <div className="col-span-2 sm:col-span-1"><p className="text-[11px] text-foreground/50">Opening balance</p><p className="mt-1 text-sm font-semibold tabular-nums">{currency(month.openingBalance)}</p></div>
        </div>
      </Link>)}</div>
        : <div className="rounded-3xl border bg-card px-5 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-foreground/45"><HistoryIcon size={24}/></span><h2 className="mt-4 text-lg font-semibold">Your history starts here</h2><p className="mx-auto mt-1 max-w-sm text-sm text-foreground/55">As you track transactions, each month’s balance and summary will be saved here.</p></div>}
  </Layout>;
}
