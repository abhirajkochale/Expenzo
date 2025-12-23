import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Routes that DO NOT require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/403',
  '/404',
  '/privacy',
  '/about',
  '/contact',
];

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (loading) return;

    // ❌ Not logged in & trying to access protected route
    if (!user && !isPublicRoute) {
      navigate('/', { replace: true });
      return;
    }

    // ✅ Logged in but on homepage → dashboard
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, location.pathname, isPublicRoute, navigate]);

  // ⛔ HARD BLOCK RENDERING
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ⛔ Do NOT render protected pages if not logged in
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
