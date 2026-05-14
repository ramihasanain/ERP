import { useLocation } from 'react-router-dom';

/**
 * Returns the portal base path ('/admin' or '/employee') based on the current URL.
 * Use this in shared components to build navigation paths that work in both portals.
 */
export const useBasePath = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/employee')) return '/employee';
  return '/admin';
};
