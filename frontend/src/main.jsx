import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './state/AppContext.jsx';
import { useApp } from './state/AppContext.jsx';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch((error) => {
    console.error('Offline app shell could not be registered:', error);
  }));
}

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const MonthPage = lazy(() => import('./pages/MonthPage.jsx'));
const SetupPage = lazy(() => import('./pages/SetupPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'));

class TransactionsErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('Transactions page failed to render:', error, info);
  }

  render() {
    if (this.state.error) {
      return <main className="grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-3xl border bg-card p-6 text-center" role="alert"><h1 className="text-xl font-bold">Transactions couldn’t be displayed</h1><p className="mt-2 text-sm text-foreground/60">{this.state.error.message || 'The page hit an unexpected error.'}</p><button className="mt-5 min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground" onClick={() => window.location.reload()}>Reload page</button></section></main>;
    }
    return this.props.children;
  }
}

function RouteError() {
  const { appError, clearAppError } = useApp();
  if (!appError) return null;
  return <main className="grid min-h-screen place-items-center p-5"><section className="max-w-lg rounded-2xl border bg-card p-6"><h1 className="text-xl font-semibold">Expense Tracker is offline</h1><p className="mt-2 text-sm text-foreground/65">{appError}</p><button className="mt-5 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground" onClick={() => { clearAppError(); window.location.reload(); }}>Try again</button></section></main>;
}

function AppRoutes() {
  const { appError } = useApp();
  if (appError) return <RouteError />;
  return <Suspense fallback={<div className="grid min-h-screen place-items-center text-foreground/60">Loading...</div>}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
    <Route path="/months/:monthId" element={<ProtectedRoute><MonthPage /></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><TransactionsErrorBoundary><TransactionsPage /></TransactionsErrorBoundary></ProtectedRoute>} />
    <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, setupComplete, checkingSetup } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (checkingSetup || setupComplete === null) {
    return <div className="grid min-h-screen place-items-center text-foreground/60 font-medium">Checking application status...</div>;
  }
  if (!setupComplete) return <Navigate to="/setup" replace />;
  return children;
}

function SetupRoute({ children }) {
  const { isAuthenticated, setupComplete, checkingSetup } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (checkingSetup || setupComplete === null) {
    return <div className="grid min-h-screen place-items-center text-foreground/60 font-medium">Checking application status...</div>;
  }
  if (setupComplete) return <Navigate to="/" replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
