import { useState } from 'react';
import { BarChart3, ChevronDown, FolderOpen, Home, List, LogOut, Moon, MoreHorizontal, Settings2, Sun, Wallet } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';
import { useApp } from '../state/AppContext';
import { monthLabel } from '../lib/utils';

export default function Layout({ children, history = [] }) {
  const { dark, setDark, logout, user } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const grouped = history.reduce((acc, item) => { acc[item.year] = [...(acc[item.year] || []), item]; return acc; }, {});
  const latestMonth = history[0];
  const analyticsHref = latestMonth ? `/months/${latestMonth.id}` : '/history';
  const primary = [
    { to: '/', label: 'Home', icon: Home, isActive: location.pathname === '/' },
    { to: '/transactions', label: 'Transactions', icon: List, isActive: location.pathname === '/transactions' },
    { to: analyticsHref, label: 'Analytics', icon: BarChart3, isActive: location.pathname.startsWith('/months/') },
    { to: '/history', label: 'History', icon: FolderOpen, isActive: location.pathname === '/history' }
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r bg-card px-4 py-6 lg:flex">
        <Link to="/" className="mb-9 flex items-center gap-3 px-2 text-[15px] font-bold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Wallet size={19} /></span>Expense Tracker</Link>
        <div className="mb-6 rounded-2xl bg-muted/70 p-3">
          <p className="truncate text-sm font-semibold">{user?.name || 'Your account'}</p>
          <p className="mt-0.5 truncate text-xs text-foreground/55">{user?.email || ''}</p>
        </div>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-foreground/40">Workspace</p>
        <nav aria-label="Main navigation" className="grid gap-1">
          {[
            { to: '/', label: 'Home', icon: Home },
            { to: '/transactions', label: 'Transactions', icon: List },
            { to: analyticsHref, label: 'Analytics', icon: BarChart3 },
            { to: '/history', label: 'Monthly history', icon: FolderOpen },
            { to: '/categories', label: 'Categories', icon: Wallet },
            { to: '/settings', label: 'Settings', icon: Settings2 }
          ].map(({ to, label, icon: Icon }) => <NavLink key={label} to={to} end={to === '/'} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted ${isActive ? 'nav-active' : 'text-foreground/65'}`}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-foreground/40">Months</p>
          <div className="space-y-4 overflow-auto pb-2">
            {Object.entries(grouped).map(([year, months]) => <div key={year}><p className="mb-1 px-3 text-xs font-semibold text-foreground/50">{year}</p><div className="grid gap-0.5">{months.map((month) => <Link key={month.id} to={`/months/${month.id}`} className={`rounded-lg px-3 py-2 text-sm hover:bg-muted ${location.pathname === `/months/${month.id}` ? 'font-semibold text-primary' : 'text-foreground/65'}`}>{monthLabel(month.month, month.year).replace(` ${month.year}`, '')}</Link>)}</div></div>)}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
          <Button variant="secondary" className="h-11 px-2 text-xs" onClick={() => setDark(!dark)}>{dark ? <Sun size={15} /> : <Moon size={15} />}Theme</Button>
          <Button variant="secondary" className="h-11 px-2 text-xs" onClick={logout}><LogOut size={15} />Log out</Button>
        </div>
      </aside>
      <main className="page-enter mx-auto min-h-screen w-full max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:col-start-2 lg:px-10 lg:pb-28 lg:pt-9 xl:px-12">{children}</main>
      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {primary.map(({ to, label, icon: Icon, isActive }) => <Link key={label} to={to} aria-current={isActive ? 'page' : undefined} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground/55'}`}><Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />{label}</Link>)}
          <button onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[10px] font-medium ${moreOpen || ['/categories', '/settings'].includes(location.pathname) ? 'text-primary' : 'text-foreground/55'}`}><MoreHorizontal size={19} aria-hidden="true" />More</button>
        </div>
      </nav>
      {moreOpen && <><button className="fixed inset-0 z-30 bg-black/10 lg:hidden" aria-label="Close menu" onClick={() => setMoreOpen(false)} /><div className="fixed bottom-[calc(4.6rem+env(safe-area-inset-bottom))] right-3 z-40 w-60 rounded-2xl border bg-card p-2 shadow-xl lg:hidden">
        <Link onClick={() => setMoreOpen(false)} to="/categories" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm hover:bg-muted"><Wallet size={17} />Manage categories</Link>
        <Link onClick={() => setMoreOpen(false)} to="/settings" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm hover:bg-muted"><Settings2 size={17} />Settings</Link>
        <button onClick={() => { setDark(!dark); setMoreOpen(false); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm hover:bg-muted">{dark ? <Sun size={17} /> : <Moon size={17} />}Appearance</button>
        <button onClick={() => { setMoreOpen(false); logout(); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-destructive hover:bg-muted"><LogOut size={17} />Log out</button>
      </div></>}
    </div>
  );
}
