import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { client } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const [token, setToken] = useState(() => localStorage.getItem('expense_tracker_token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('expense_tracker_user') || 'null'));
  const [lookups, setLookups] = useState({ categories: [], creditSources: [] });
  const [setupComplete, setSetupComplete] = useState(null);
  const [checkingSetup, setCheckingSetup] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  function logout() {
    localStorage.removeItem('expense_tracker_token');
    localStorage.removeItem('expense_tracker_user');
    setToken(null);
    setUser(null);
    setSetupComplete(null);
    setLookups({ categories: [], creditSources: [] });
  }

  function applyAuth(auth) {
    localStorage.setItem('expense_tracker_token', auth.token);
    localStorage.setItem('expense_tracker_user', JSON.stringify(auth.user));
    setToken(auth.token);
    setUser(auth.user);
  }

  function isTokenExpired(value = token) {
    if (!value) return true;
    try {
      const payload = JSON.parse(atob(value.split('.')[1]));
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  useEffect(() => {
    client.setUnauthorizedHandler(logout);
  }, []);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      logout();
      return;
    }
    setCheckingSetup(true);
    Promise.all([
      client.setupStatus(),
      client.categories(),
      client.creditSources()
    ])
      .then(([status, categories, creditSources]) => {
        setSetupComplete(status.setupComplete);
        setLookups({ categories, creditSources });
      })
      .catch((err) => {
        console.error('Failed to initialize app state:', err);
        setSetupComplete(false);
      })
      .finally(() => {
        setCheckingSetup(false);
      });
  }, [token]);

  const value = useMemo(() => ({
    dark,
    setDark,
    lookups,
    token,
    user,
    setupComplete,
    setSetupComplete,
    checkingSetup,
    applyAuth,
    logout,
    isAuthenticated: Boolean(token && !isTokenExpired(token))
  }), [dark, lookups, token, user, setupComplete, checkingSetup]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

