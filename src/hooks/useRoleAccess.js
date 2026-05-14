import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRoleAccess, canAccessModule as checkModuleAccess } from '@/config/rolePermissions';

export const useRoleAccess = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const access = getRoleAccess(user);
    return {
      allowedModules: access.modules,
      canModify: access.canModify,
      canAccessModule: (moduleKey) => checkModuleAccess(user, moduleKey),
      isViewer: !access.canModify && access.modules.length > 0,
    };
  }, [user]);
};
