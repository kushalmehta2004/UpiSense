import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-2 border-[#00a651] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
