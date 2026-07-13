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
      setError(ex.response?.data?.message || 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Login">
      <form onSubmit={submit} className="grid gap-4">
        <input required type="email" className="h-11 rounded-md border bg-card px-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" className="h-11 rounded-md border bg-card px-3" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={saving}>{saving ? 'Signing in...' : 'Login'}</Button>
        <p className="text-center text-sm text-foreground/60">New here? <Link className="text-primary" to="/register">Create account</Link></p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, children }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="glass w-full max-w-md rounded-lg border p-6">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-md bg-primary text-white">
          <Wallet />
        </div>
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </section>
    </main>
  );
}
