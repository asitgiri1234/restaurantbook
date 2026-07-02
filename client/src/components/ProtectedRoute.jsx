import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guards routes by authentication and (optionally) role.
 * - Not logged in  -> redirect to /login
 * - Wrong role     -> redirect to their own home
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-center">Loading…</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (role === 'customer' && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
