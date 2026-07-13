import { LogOut, Moon, Sun, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { useApp } from '../state/AppContext';
import { monthLabel } from '../lib/utils';

export default function Layout({ children, history = [] }) {
  const { dark, setDark } = useApp();
  const { logout, user } = useApp();
  const grouped = history.reduce((acc, item) => {
    acc[item.year] = [...(acc[item.year] || []), item];
    return acc;
  }, {});

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b bg-card/70 p-4 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
              <Wallet size={20} />
            </span>
            Expense Tracker
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
        <div className="mb-6 flex items-center justify-between rounded-md border p-3 text-sm">
          <span className="truncate">{user?.name}</span>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout"><LogOut size={16} /></Button>
        </div>
        <nav className="space-y-4">
          {Object.entries(grouped).map(([year, months]) => (
            <div key={year}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">{year}</p>
              <div className="grid gap-1">
                {months.map((month) => (
                  <Link
                    key={month.id}
                    to={`/months/${month.id}`}
                    className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    {monthLabel(month.month, month.year).replace(` ${month.year}`, '')}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
