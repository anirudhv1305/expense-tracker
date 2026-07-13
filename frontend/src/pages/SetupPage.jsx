import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { client } from '../services/api';
import { Button } from '../components/ui/Button';

export default function SetupPage() {
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    await client.setup(Number(balance));
    navigate('/');
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-lg border p-6">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-md bg-primary text-white">
          <Wallet />
        </div>
        <h1 className="text-2xl font-semibold">Current Bank Balance</h1>
        <p className="mt-2 text-sm text-foreground/60">This becomes your initial balance and starts the first tracking period from today.</p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium">Amount</span>
          <div className="flex h-12 items-center rounded-md border bg-card px-3 text-lg">
            <span className="text-foreground/50">₹</span>
            <input
              autoFocus
              required
              min="0"
              step="0.01"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="ml-2 w-full bg-transparent outline-none"
              placeholder="18500"
            />
          </div>
        </label>
        <Button className="mt-6 w-full" disabled={saving}>{saving ? 'Starting...' : 'Continue'}</Button>
      </form>
    </main>
  );
}
