import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Download, Save, TrendingUp, Wallet } from 'lucide-react';
import { CreditDebitBar, DailyLine, ExpensePie } from '../components/Charts';
import CategoryDetailsModal from '../components/CategoryDetailsModal';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import TransactionTable from '../components/TransactionTable';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { currency, monthLabel } from '../lib/utils';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';

export default function MonthPage() {
  const { monthId } = useParams();
  const { lookups } = useApp();
  const [history, setHistory] = useState([]);
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [month, months] = await Promise.all([client.month(monthId), client.history()]);
      setData(month);
      setNotes(month.notes || '');
      setHistory(months);
    } catch (cause) { setError(`Could not reach Supabase. ${cause.message || 'Check your connection and retry.'}`); }
  }, [monthId]);

  async function download(type) {
    try {
      const response = type === 'csv' ? await client.downloadCsv(month.id) : await client.downloadExcel(month.id);
      await downloadFile(response, `${monthLabel(month.month, month.year).replace(' ', '_')}.${type}`);
      setError('');
    } catch (cause) { setError(`Export could not be generated. ${cause.message || 'Check your connection and retry.'}`); }
  }

  async function saveNotes() {
    setSavingNote(true); setNoteMessage('');
    try { await client.saveNote(month.id, notes); setNoteMessage('Notes saved.'); }
    catch (cause) { setError(`Notes were not saved. ${cause.message || 'Check your connection and retry.'}`); }
    finally { setSavingNote(false); }
  }

  useEffect(() => { load(); }, [load]);

  const calendar = useMemo(() => {
    if (!data) return [];
    const byDate = Object.fromEntries(data.dailySpending.map((d) => [d.date, d.amount]));
    const start = new Date(data.month.year, data.month.month - 1, 1);
    const days = new Date(data.month.year, data.month.month, 0).getDate();
    const blanks = Array.from({ length: start.getDay() }, () => null);
    const dates = Array.from({ length: days }, (_, i) => {
      const date = `${data.month.year}-${String(data.month.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      return { date, day: i + 1, amount: byDate[date] || 0 };
    });
    return [...blanks, ...dates];
  }, [data]);

  if (!data) return <div className="grid min-h-screen place-items-center p-5"><div className="max-w-lg rounded-xl border bg-card p-5">{error || 'Loading month...'}{error && <Button className="mt-4" onClick={load}>Try again</Button>}</div></div>;
  const { month, insights } = data;

  return (
    <Layout history={history}>
      {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Monthly insights</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{monthLabel(month.month, month.year)}</h1>
          <p className="mt-1 text-sm text-foreground/55">Your cash flow, spending patterns and notes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => download('csv')}><Download size={16} /> Export CSV</Button>
          <Button variant="secondary" onClick={() => download('xlsx')}><Download size={16} /> Export Excel</Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="finance-hero col-span-2 rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2 text-sm text-white/65"><Wallet size={16}/>Closing balance</div><p className="mt-2 text-3xl font-bold tabular-nums">{currency(month.closingBalance)}</p><div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/15 pt-3"><div><p className="flex items-center gap-1 text-xs text-white/65"><ArrowDownLeft size={13}/>Income</p><p className="mt-1 font-semibold">{currency(month.totalCredits)}</p></div><div><p className="flex items-center gap-1 text-xs text-white/65"><ArrowUpRight size={13}/>Expenses</p><p className="mt-1 font-semibold">{currency(month.totalDebits)}</p></div></div></div>
        <MetricCard label="Opening balance" value={month.openingBalance} />
        <MetricCard label="Net savings" value={month.savings} tone="analytics" />
        <div className="col-span-2 rounded-2xl border bg-card p-5 lg:col-span-2"><div className="flex items-center gap-2 text-sm text-foreground/55"><TrendingUp size={16}/>Activity</div><p className="mt-2 text-2xl font-bold">{month.transactionCount}<span className="ml-2 text-sm font-medium text-foreground/50">transactions recorded</span></p></div>
      </section>

      <div className="mb-3 mt-8"><h2 className="text-lg font-bold tracking-tight">Cash flow & trends</h2><p className="mt-1 text-sm text-foreground/55">Patterns behind your monthly totals.</p></div>
      <section className="grid gap-4 xl:grid-cols-3">
        <ExpensePie data={data.categoryTotals} />
        <DailyLine data={data.dailySpending} />
        <CreditDebitBar month={month} />
      </section>

      <div className="mb-3 mt-8"><h2 className="text-lg font-bold tracking-tight">Spending detail</h2><p className="mt-1 text-sm text-foreground/55">Explore categories and the transactions behind them.</p></div>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardTitle>Category Breakdown</CardTitle>
          <div className="mt-4 space-y-3">
            {data.categoryTotals.map((category) => (
              <button key={category.id} className="w-full rounded-xl px-2 py-3 text-left transition hover:bg-muted/70" onClick={() => setSelectedCategory(category)}>
                <span className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium">{category.name}</span><span className="shrink-0 font-bold tabular-nums">{currency(category.total)}</span></span>
                <span className="mt-2 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(2, Math.min(100, category.percentage))}%` }}/></span><span className="w-10 text-right text-xs text-foreground/50">{category.percentage}%</span></span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Expense Insights</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Largest Expense" value={insights.largestExpense ? `${insights.largestExpense.description} (${currency(insights.largestExpense.amount)})` : 'No expenses'} />
            <Info label="Most Used Category" value={insights.mostUsedCategory} />
            <Info label="Highest Spending Day" value={insights.highestSpendingDay} />
            <Info label="Average Daily Spending" value={currency(insights.averageDailySpending)} />
            <Info label="Average Transaction Value" value={currency(insights.averageTransactionValue)} />
          </dl>
        </Card>
      </section>

      <div className="mb-3 mt-8"><h2 className="text-lg font-bold tracking-tight">Month at a glance</h2></div>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Calendar View</CardTitle>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-foreground/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendar.map((day, index) => day ? (
              <div key={day.date} className="min-h-20 rounded-md border p-2 text-sm">
                <p className="font-medium">{day.day}</p>
                <p className="mt-3 text-xs text-destructive">{Number(day.amount) > 0 ? currency(day.amount) : ''}</p>
              </div>
            ) : <div key={index} />)}
          </div>
        </Card>
        <Card>
          <CardTitle>Income Summary</CardTitle>
          <div className="mt-4 space-y-3">
            {data.sourceTotals.map((source) => (
              <div key={source.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{source.name}</span>
                <span className="font-semibold text-success">{currency(source.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Monthly Notes</CardTitle>
          <p className="mt-1 text-sm text-foreground/55">A private reminder for this month.</p>
          <textarea aria-label="Monthly notes" placeholder="What do you want to remember about this month?" className="mt-4 min-h-36 w-full resize-y rounded-xl border bg-background p-4 outline-none focus:border-primary" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="mt-3" onClick={saveNotes} disabled={savingNote}><Save size={16} /> {savingNote ? 'Saving...' : 'Save Notes'}</Button>
          {noteMessage && <p className="mt-2 text-sm text-success">{noteMessage}</p>}
        </Card>
        <Card>
          <CardTitle>Previous Month Comparison</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Compared With" value={data.comparison.label} />
            <Info label="Income" value={`${data.comparison.incomePct}%`} />
            <Info label="Expenses" value={`${data.comparison.expensesPct}%`} />
            <Info label="Savings" value={`${data.comparison.savingsPct}%`} />
            {data.comparison.categoryChanges.map((category) => <Info key={category.id} label={category.name} value={`${category.percentage}%`} />)}
          </dl>
        </Card>
      </section>

      <section className="mt-6">
        {data.subCategoryTotals?.some((sub) => sub.transactions.length > 0) && (
          <Card className="mb-6">
            <CardTitle>Subcategory Breakdown</CardTitle>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {data.subCategoryTotals.map((sub) => (
                <div key={`${sub.category}-${sub.name}`} className="rounded-md border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div><h3 className="font-semibold">{sub.name}</h3><p className="text-xs text-foreground/55">{sub.category}</p></div>
                    <span>{currency(sub.total)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {sub.transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between gap-3">
                        <span>{tx.description}</span>
                        <span>{currency(tx.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        <TransactionTable transactions={data.transactions} categories={lookups.categories} onDeleted={load} />
      </section>
      {selectedCategory && (
        <CategoryDetailsModal
          category={data.categoryTotals.find((item) => item.id === selectedCategory.id) || selectedCategory}
          month={data.month}
          transactions={data.transactions}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </Layout>
  );
}

async function downloadFile(response, filename) {
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Info({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
      <dt className="text-foreground/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
