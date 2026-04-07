import { useHasRole } from '../../hooks/useRoles';

/**
 * Conditionally renders children based on user role.
 */
export default function RoleGuard({ roles, children, fallback = null }) {
  const hasRole = useHasRole(...roles);
  if (!hasRole) return fallback;
  return children;
}
