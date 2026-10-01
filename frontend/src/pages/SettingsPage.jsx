import { useCallback, useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { client } from '../services/api';
import { currency, monthLabel } from '../lib/utils';

export default function SettingsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    const [data, months] = await Promise.all([client.dashboard(), client.history()]);
    setDashboard(data);
    setHistory(months);
    setBalance(String(data.month.openingBalance));
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Could not load settings.'))
      .finally(() => setLoading(false));
  }, [load]);

  async function saveOpeningBalance(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await client.updateOpeningBalance(Number(balance));
      await load();
      setMessage('Opening balance updated. Monthly totals have been recalculated.');
    } catch (err) {
      setError(err.message || 'Could not update the opening balance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout history={history}>
      <header className="mb-6">
        <p className="text-sm text-foreground/55">Manage your account preferences</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-xl bg-success/10 p-3 text-sm text-success">{message}</p>}
      {loading ? <p className="text-sm text-foreground/60">Loading settings…</p> : dashboard && (
        <Card className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Landmark size={20} /></span>
            <div>
              <CardTitle>Opening balance</CardTitle>
              <p className="mt-1 text-sm text-foreground/60">For {monthLabel(dashboard.month.month, dashboard.month.year)}</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-foreground/60">Current opening balance</p>
          <p className="mt-1 text-2xl font-semibold">{currency(dashboard.month.openingBalance)}</p>
          <form onSubmit={saveOpeningBalance} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">New opening balance
              <input required type="number" inputMode="decimal" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} className="h-12 rounded-xl border bg-card px-4 text-lg" />
            </label>
            <p className="text-xs text-foreground/55">Your transactions stay unchanged. The month balance and later monthly opening balances recalculate from this amount.</p>
            <Button disabled={saving}>{saving ? 'Saving…' : 'Save opening balance'}</Button>
          </form>
        </Card>
      )}
    </Layout>
  );
}
