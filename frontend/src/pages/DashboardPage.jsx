import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Tags, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import TransactionModal from '../components/TransactionModal';
import CategoryDetailsModal from '../components/CategoryDetailsModal';
import { ExpensePie } from '../components/Charts';
import { Card, CardTitle } from '../components/ui/Card';
import { client } from '../services/api';
import { currency, monthLabel } from '../lib/utils';
import { Button } from '../components/ui/Button';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [monthDetails, setMonthDetails] = useState(null);
  const monthDetailsRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoadError('');
      const [dash, months] = await Promise.all([client.dashboard(), client.history()]);
      setDashboard(dash);
      setHistory(months);
      if (monthDetailsRef.current && dash.month.id === monthDetailsRef.current.month.id) setMonthDetails(await client.month(dash.month.id));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setLoadError(`Could not load your dashboard. ${err.message || 'Check your connection and retry.'}`);
    }
  }, []);

  async function openCategory(category) {
    setSelectedCategory(category);
    setMonthDetails(await client.month(dashboard.month.id));
  }

  useEffect(() => { monthDetailsRef.current = monthDetails; }, [monthDetails]);
  useEffect(() => { load(); }, [load]);

  if (!dashboard && loadError) return <div className="grid min-h-screen place-items-center p-5"><div role="alert" className="max-w-lg rounded-2xl border bg-card p-6"><p>{loadError}</p><Button className="mt-4" onClick={load}>Try again</Button></div></div>;
  if (!dashboard) return <div className="mx-auto grid min-h-screen max-w-3xl gap-4 p-6 content-start pt-20"><div className="h-6 w-40 animate-pulse rounded-lg bg-muted"/><div className="h-52 animate-pulse rounded-3xl bg-muted"/><div className="h-28 animate-pulse rounded-2xl bg-muted"/><p className="text-sm text-foreground/55">Loading your finances…</p></div>;
  const { month } = dashboard;

  return (
    <Layout history={history}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-primary">Monthly overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{monthLabel(month.month, month.year)}</h1><p className="mt-1 text-sm text-foreground/55">A clear picture of your money this month.</p></div>
        <Link to={`/months/${month.id}`} className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">View insights <ArrowRight size={16} /></Link>
      </div>
      {loadError && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{loadError} <button className="underline" onClick={load}>Retry</button></p>}

      <section aria-label="Current balance" className="finance-hero relative overflow-hidden rounded-[1.7rem] p-6 shadow-lg shadow-black/10 sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-2 -top-12 h-52 w-52 rounded-full border border-white/10"/>
        <div className="relative grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div><div className="flex items-center gap-2 text-sm text-white/70"><Wallet size={16} /> Available balance</div><p className="mt-3 break-words text-4xl font-bold tracking-tight sm:text-5xl">{currency(dashboard.currentBankBalance)}</p><p className="mt-2 text-sm text-white/60">Opening balance {currency(month.openingBalance)}</p></div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-3 border-t border-white/15 pt-4 md:min-w-[290px] md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <div><p className="flex items-center gap-1.5 text-xs font-medium text-white/65"><ArrowDownLeft size={14} />Income</p><p className="mt-1 font-semibold text-white">{currency(month.totalCredits)}</p></div>
            <div><p className="flex items-center gap-1.5 text-xs font-medium text-white/65"><ArrowUpRight size={14} />Spent</p><p className="mt-1 font-semibold text-white/80">{currency(month.totalDebits)}</p></div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-foreground/55">Income</p><p className="mt-1 text-lg font-bold text-success sm:text-xl">{currency(month.totalCredits)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-foreground/55">Expenses</p><p className="mt-1 text-lg font-bold text-destructive sm:text-xl">{currency(month.totalDebits)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-foreground/55">Left this month</p><p className="mt-1 text-lg font-bold sm:text-xl">{currency(month.closingBalance)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-foreground/55">Transactions</p><p className="mt-1 text-lg font-bold sm:text-xl">{month.transactionCount}</p></div>
      </section>

      <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold tracking-tight">Shortcuts</h2><span className="text-xs text-foreground/45">Pick up where you left off</span></div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Link to="/transactions" className="flex min-h-[92px] flex-col justify-between rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet size={18}/></span><span className="text-xs font-semibold sm:text-sm">Transactions</span></Link>
          <Link to={`/months/${month.id}`} className="flex min-h-[92px] flex-col justify-between rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-analytics/10 text-analytics"><BarChart3 size={18}/></span><span className="text-xs font-semibold sm:text-sm">Monthly insights</span></Link>
          <Link to="/history" className="flex min-h-[92px] flex-col justify-between rounded-2xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success"><CalendarDays size={18}/></span><span className="text-xs font-semibold sm:text-sm">History</span></Link>
        </div>
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        {dashboard.categoryTotals.length ? <ExpensePie data={dashboard.categoryTotals} /> : <Card className="flex min-h-[300px] flex-col justify-center"><CardTitle>Spending overview</CardTitle><div className="flex flex-1 flex-col items-center justify-center text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-foreground/50"><Tags size={21}/></span><p className="mt-3 font-semibold">No spending to chart yet</p><p className="mt-1 max-w-xs text-sm text-foreground/55">Your category breakdown will appear after your first expense.</p></div></Card>}
        <Card>
          <div className="flex items-center justify-between"><CardTitle>Recent activity</CardTitle><Link className="text-sm font-semibold text-primary" to="/transactions">See all</Link></div>
          <div className="mt-3 divide-y">
            {dashboard.recentTransactions.map((tx) => <div key={tx.id} className="flex min-h-[68px] items-center gap-3 py-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tx.type === 'CREDIT' ? 'positive-surface text-success' : 'negative-surface text-destructive'}`}>{tx.type === 'CREDIT' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{tx.description}</p><p className="mt-0.5 truncate text-xs text-foreground/55">{tx.category || tx.creditSource}{tx.subCategory || tx.creditSubCategory ? ` · ${tx.subCategory || tx.creditSubCategory}` : ''}</p></div>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${tx.type === 'CREDIT' ? 'text-success' : ''}`}>{tx.type === 'CREDIT' ? '+' : '−'}{currency(tx.amount)}</p>
            </div>)}
            {dashboard.recentTransactions.length === 0 && <div className="py-12 text-center"><p className="font-semibold">Nothing here yet</p><p className="mt-1 text-sm text-foreground/55">Add your first income or expense to get started.</p></div>}
          </div>
        </Card>
      </section>

      {dashboard.categoryTotals.length > 0 && <section className="mt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold tracking-tight">Where it went</h2><Link to={`/months/${month.id}`} className="text-sm font-semibold text-primary">Full breakdown</Link></div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{dashboard.categoryTotals.slice(0, 6).map((category) => <button key={category.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition hover:border-primary/40" onClick={() => openCategory(category)}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><Tags size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{category.name}</span><span className="mt-0.5 block text-xs text-foreground/55">{category.percentage}% of expenses</span></span><span className="text-sm font-bold tabular-nums">{currency(category.total)}</span></button>)}</div>
      </section>}
      {selectedCategory && monthDetails && <CategoryDetailsModal category={monthDetails.categoryTotals.find((item) => item.id === selectedCategory.id) || selectedCategory} month={monthDetails.month} transactions={monthDetails.transactions} onClose={() => setSelectedCategory(null)} />}
      <TransactionModal onSaved={load} />
    </Layout>
  );
}
