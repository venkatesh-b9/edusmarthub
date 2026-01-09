import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('super-admin' | 'school-admin' | 'teacher' | 'parent')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentRole } = useRole();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(currentRole)) {
    // Redirect to appropriate dashboard based on role
    switch (currentRole) {
      case 'super-admin':
        return <Navigate to="/super-admin" replace />;
      case 'school-admin':
        return <Navigate to="/school-admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'parent':
        return <Navigate to="/parent" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
