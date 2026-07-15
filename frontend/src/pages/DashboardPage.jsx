import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, Landmark, ListChecks, PiggyBank, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import TransactionModal from '../components/TransactionModal';
import CategoryDetailsModal from '../components/CategoryDetailsModal';
import { ExpensePie } from '../components/Charts';
import { Card, CardTitle } from '../components/ui/Card';
import { client } from '../services/api';
import { currency, monthLabel } from '../lib/utils';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [monthDetails, setMonthDetails] = useState(null);
  const navigate = useNavigate();

  async function load() {
    try {
      const [dash, months] = await Promise.all([client.dashboard(), client.history()]);
      setDashboard(dash);
      setHistory(months);
      if (monthDetails && dash.month.id === monthDetails.month.id) {
        setMonthDetails(await client.month(dash.month.id));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  async function openCategory(category) {
    setSelectedCategory(category);
    setMonthDetails(await client.month(dashboard.month.id));
  }

  useEffect(() => { load(); }, []);

  if (!dashboard) return <div className="grid min-h-screen place-items-center text-foreground/60">Loading dashboard...</div>;
  const { month } = dashboard;

  return (
    <Layout history={history}>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-foreground/60">Current Month</p>
          <h1 className="text-3xl font-semibold">{monthLabel(month.month, month.year)}</h1>
        </div>
        <p className="text-sm text-foreground/60">{month.startDate} to {month.endDate}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current Bank Balance" value={dashboard.currentBankBalance} icon={Wallet} />
        <MetricCard label="Opening Balance" value={month.openingBalance} icon={Landmark} />
        <MetricCard label="Total Credits" value={month.totalCredits} tone="credit" icon={ArrowUpCircle} />
        <MetricCard label="Total Debits" value={month.totalDebits} tone="debit" icon={ArrowDownCircle} />
        <MetricCard label="Remaining Balance" value={month.closingBalance} icon={Wallet} />
        <MetricCard label="Savings" value={month.savings} tone="analytics" icon={PiggyBank} />
        <MetricCard label="Transactions" value={String(month.transactionCount)} tone="analytics" icon={ListChecks} format="plain" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <ExpensePie data={dashboard.categoryTotals} />
        <Card>
          <CardTitle>Recent Transactions</CardTitle>
          <div className="mt-4 space-y-3">
            {dashboard.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-foreground/50">{tx.category || tx.creditSource}</p>
                </div>
                <p className={tx.type === 'CREDIT' ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{currency(tx.amount)}
                </p>
              </div>
            ))}
            {dashboard.recentTransactions.length === 0 && <p className="text-sm text-foreground/50">No transactions yet.</p>}
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardTitle>Categories</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.categoryTotals.map((category) => (
              <button key={category.id} className="rounded-md border p-3 text-left transition hover:bg-muted" onClick={() => openCategory(category)}>
                <p className="text-sm text-foreground/60">{category.name}</p>
                <p className="mt-2 text-xl font-semibold">{currency(category.total)}</p>
                <p className="text-xs text-foreground/50">{category.percentage}% of expenses</p>
              </button>
            ))}
          </div>
        </Card>
      </section>
      {selectedCategory && monthDetails && (
        <CategoryDetailsModal
          category={monthDetails.categoryTotals.find((item) => item.id === selectedCategory.id) || selectedCategory}
          month={monthDetails.month}
          transactions={monthDetails.transactions}
          onClose={() => setSelectedCategory(null)}
        />
      )}
      <TransactionModal onSaved={load} />
    </Layout>
  );
}
