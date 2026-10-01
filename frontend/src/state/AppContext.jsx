import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth';
import { supabase } from '../services/supabase';
import { client } from '../services/api';

const AppContext = createContext(null);

function appUser(authUser) {
  if (!authUser) return null;
  return { id: authUser.id, email: authUser.email, name: authUser.user_metadata?.name || authUser.email };
}

export function AppProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [lookups, setLookups] = useState({ categories: [], creditSources: [], categoryTree: [] });
  const [setupComplete, setSetupComplete] = useState(null);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [appError, setAppError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    if (!supabase) {
      setCheckingSetup(false);
      setAppError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.');
      return undefined;
    }
    let alive = true;
    authService.getSession()
      .then((current) => {
        if (!alive) return;
        setSession(current);
        setUser(appUser(current?.user));
      })
      .catch((error) => { if (alive) setAppError(error.message); })
      .finally(() => { if (alive) setCheckingSetup(false); });
    const { data: listener } = authService.onAuthStateChange((_event, current) => {
      setSession(current);
      setUser(appUser(current?.user));
      if (!current) {
        setSetupComplete(null);
        setLookups({ categories: [], creditSources: [], categoryTree: [] });
        setAppError('');
      }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    setSession(null); setUser(null); setSetupComplete(null);
    setLookups({ categories: [], creditSources: [], categoryTree: [] });
    await client.logout();
  }

  async function refreshCategories() {
    const [categories, creditSources, categoryTree] = await Promise.all([client.categories(), client.creditSources(), client.categoryTree()]);
    setLookups({ categories, creditSources, categoryTree });
  }

  async function loadApplicationState() {
    setAppError(''); setCheckingSetup(true);
    try {
      const [status, categories, creditSources, categoryTree] = await Promise.all([
        client.setupStatus(), client.categories(), client.creditSources(), client.categoryTree()
      ]);
      setSetupComplete(status.setupComplete);
      setLookups({ categories, creditSources, categoryTree });
    } catch (error) {
      setSetupComplete(null);
      setAppError(`Supabase could not be reached: ${error.message || 'check your connection and project configuration.'}`);
    } finally { setCheckingSetup(false); }
  }

  useEffect(() => {
    if (session?.user?.id) loadApplicationState();
  }, [session?.user?.id]);

  const value = useMemo(() => ({
    dark, setDark, lookups, user, setupComplete,
    setSetupComplete, checkingSetup, appError, clearAppError: () => setAppError(''),
    applyAuth: (auth) => { if (auth?.session) { setSession(auth.session); setUser(appUser(auth.session.user)); } },
    refreshCategories, logout, isAuthenticated: Boolean(session?.user)
  }), [dark, lookups, session, user, setupComplete, checkingSetup, appError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
