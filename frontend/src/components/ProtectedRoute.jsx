import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';

const MINT = '#00D4A0';

export function ProtectedRoute({ children }) {
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
        <div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: MINT }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
}
