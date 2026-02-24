import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { FAQ } from './pages/FAQ';
import { WhatsAppSupport } from './pages/WhatsAppSupport';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Debts } from './pages/Debts';
import { Settings } from './pages/Settings';

function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/whatsapp-support" element={<WhatsAppSupport />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="debts" element={<Debts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
