import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { client } from '../services/api';
import { useApp } from '../state/AppContext';
import { AuthShell } from './LoginPage';

export default function RegisterPage() {
  const { applyAuth, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Confirm password must match password');
      return;
    }
    setSaving(true);
    try {
      const auth = await client.register(form);
      applyAuth(auth);
      if (auth.session) navigate('/setup');
      else setError('Account created. Check your email to confirm it, then log in.');
    } catch (ex) {
      setError(ex.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Register">
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">Name<input required autoComplete="name" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="grid gap-1.5 text-sm font-semibold">Email<input required autoComplete="email" type="email" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="grid gap-1.5 text-sm font-semibold">Password<input required minLength={8} autoComplete="new-password" type="password" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label className="grid gap-1.5 text-sm font-semibold">Confirm password<input required autoComplete="new-password" type="password" className="h-12 rounded-xl border bg-card px-4 font-normal" placeholder="Enter your password again" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button className="min-h-12" disabled={saving}>{saving ? 'Creating...' : 'Create account'}</Button>
        <p className="text-center text-sm text-foreground/60">Already registered? <Link className="text-primary" to="/login">Login</Link></p>
      </form>
    </AuthShell>
  );
}
