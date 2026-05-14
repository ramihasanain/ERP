import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canAccessModule } from '@/config/rolePermissions';

const RoleProtectedRoute = ({ moduleKey, children }) => {
  const { user } = useAuth();

  if (!canAccessModule(user, moduleKey)) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
