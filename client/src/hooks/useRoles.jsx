import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Hook to check if current user has any of the required roles.
 */
export function useHasRole(...allowedRoles) {
  const { role } = useAuth();
  if (!role) return false;
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}

/**
 * Protected route wrapper. Redirects to /login if not authenticated.
 */
export function RequireAuth({ children, roles }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location }, replace: true });
    return null;
  }

  if (roles && roles.length > 0) {
    const { role } = useAuth();
    if (!roles.includes(role)) {
      navigate('/unauthorized', { replace: true });
      return null;
    }
  }

  return children;
}
