import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Save } from 'lucide-react';
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

  async function load() {
    const [month, months] = await Promise.all([client.month(monthId), client.history()]);
    setData(month);
    setNotes(month.notes || '');
    setHistory(months);
  }

  async function download(type) {
    const response = type === 'csv' ? await client.downloadCsv(month.id) : await client.downloadExcel(month.id);
    await downloadFile(response, `${monthLabel(month.month, month.year).replace(' ', '_')}.${type}`);
  }

  useEffect(() => { load(); }, [monthId]);

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

  if (!data) return <div className="grid min-h-screen place-items-center text-foreground/60">Loading month...</div>;
  const { month, insights } = data;

  return (
    <Layout history={history}>
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-foreground/60">Monthly Dashboard</p>
          <h1 className="text-3xl font-semibold">{monthLabel(month.month, month.year)}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => download('csv')}><Download size={16} /> CSV</Button>
          <Button variant="secondary" onClick={() => download('xlsx')}><Download size={16} /> Excel</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Opening Balance" value={month.openingBalance} />
        <MetricCard label="Total Credits" value={month.totalCredits} tone="credit" />
        <MetricCard label="Total Debits" value={month.totalDebits} tone="debit" />
        <MetricCard label="Closing Balance" value={month.closingBalance} />
        <MetricCard label="Savings" value={month.savings} tone="analytics" />
        <MetricCard label="Transactions" value={String(month.transactionCount)} tone="analytics" format="plain" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <ExpensePie data={data.categoryTotals} />
        <DailyLine data={data.dailySpending} />
        <CreditDebitBar month={month} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>Category Breakdown</CardTitle>
          <div className="mt-4 space-y-3">
            {data.categoryTotals.map((category) => (
              <button key={category.id} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted" onClick={() => setSelectedCategory(category)}>
                <span>{category.name}</span>
                <span className="font-semibold">{currency(category.total)}</span>
                <span className="text-foreground/50">{category.percentage}%</span>
                {category.name === 'Outings' && data.outingSubCategories?.map((sub) => (
                  <div key={sub.name} className="col-span-3 ml-4 flex justify-between rounded-md bg-muted px-3 py-2 text-xs">
                    <span>{sub.name}</span>
                    <span>{currency(sub.total)}</span>
                  </div>
                ))}
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

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
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
          <textarea className="mt-4 min-h-36 w-full rounded-md border bg-card p-3 outline-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="mt-3" onClick={() => client.saveNote(month.id, notes)}><Save size={16} /> Save Notes</Button>
        </Card>
        <Card>
          <CardTitle>Previous Month Comparison</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <Info label="Compared With" value={data.comparison.label} />
            <Info label="Income" value={`${data.comparison.incomePct}%`} />
            <Info label="Expenses" value={`${data.comparison.expensesPct}%`} />
            <Info label="Savings" value={`${data.comparison.savingsPct}%`} />
            <Info label="Shopping" value={`${data.comparison.shoppingPct}%`} />
            <Info label="Food" value={`${data.comparison.foodPct}%`} />
            <Info label="Travel" value={`${data.comparison.travelPct}%`} />
          </dl>
        </Card>
      </section>

      <section className="mt-6">
        {data.outingSubCategories?.some((sub) => sub.transactions.length > 0) && (
          <Card className="mb-6">
            <CardTitle>Outings Details</CardTitle>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {data.outingSubCategories.map((sub) => (
                <div key={sub.name} className="rounded-md border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{sub.name}</h3>
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
