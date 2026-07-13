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
      navigate('/setup');
    } catch (ex) {
      setError(ex.response?.data?.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Register">
      <form onSubmit={submit} className="grid gap-4">
        <input required className="h-11 rounded-md border bg-card px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" className="h-11 rounded-md border bg-card px-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required minLength={8} type="password" className="h-11 rounded-md border bg-card px-3" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input required type="password" className="h-11 rounded-md border bg-card px-3" placeholder="Confirm Password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</Button>
        <p className="text-center text-sm text-foreground/60">Already registered? <Link className="text-primary" to="/login">Login</Link></p>
      </form>
    </AuthShell>
  );
}
