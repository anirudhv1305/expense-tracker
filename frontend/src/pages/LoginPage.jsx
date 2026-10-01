import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';

export default function LoginPage() {
  const { applyAuth, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const auth = await client.login(form);
      applyAuth(auth);
      navigate('/');
    } catch (ex) {
      setError(ex.message || 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Login">
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">Email<input required autoComplete="email" type="email" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="grid gap-1.5 text-sm font-semibold">Password<input required autoComplete="current-password" type="password" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="Your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button className="mt-1 min-h-12" disabled={saving}>{saving ? 'Signing in...' : 'Sign in'}</Button>
        <p className="text-center text-sm text-foreground/60">New here? <Link className="text-primary" to="/register">Create account</Link></p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4 sm:p-8">
      <section className="glass w-full max-w-[460px] rounded-[1.7rem] border p-6 shadow-xl shadow-black/[.04] sm:p-9">
        <LinkBrand />
        <p className="mt-8 text-sm font-semibold text-primary">YOUR FINANCES, IN FOCUS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title === 'Login' ? 'Welcome back' : 'Start with a clear picture'}</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-foreground/55">{title === 'Login' ? 'Sign in to pick up right where you left off.' : 'A calmer way to track income, spending and the balance that matters.'}</p>
        {children}
      </section>
    </main>
  );
}

function LinkBrand() { return <div className="flex items-center gap-3 text-sm font-bold"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Wallet size={20}/></span>Expense Tracker</div>; }
