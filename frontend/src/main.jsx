import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './state/AppContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MonthPage from './pages/MonthPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { useApp } from './state/AppContext.jsx';
import './index.css';

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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
          <Route path="/months/:monthId" element={<ProtectedRoute><MonthPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
