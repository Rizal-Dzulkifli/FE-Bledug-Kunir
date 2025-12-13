import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, RolePermissions } from '../types/auth';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredPermission?: keyof RolePermissions;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole, 
  fallbackPath = "/" 
}: ProtectedRouteProps) => {
  const { state, hasPermission, hasRole } = useAuth();

  // Show loading while checking authentication
  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!state.isAuthenticated || !state.token) {
    return <Navigate to="/" replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    console.warn(`Access denied: User role "${state.role}" does not match required role "${requiredRole}"`);
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.warn(`Access denied: User role "${state.role}" does not have permission "${requiredPermission}"`);
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute;
