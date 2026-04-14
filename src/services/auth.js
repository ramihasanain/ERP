const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const TENANT_DOMAIN_KEY = 'tenant_domain';
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const storeTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

export const removeTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  return `https://${withoutProtocol}`.replace(/\/+$/, '');
};

export const storeTenantDomain = (domain) => {
  const normalizedDomain = normalizeUrl(domain);
  if (!normalizedDomain) return;
  localStorage.setItem(TENANT_DOMAIN_KEY, normalizedDomain);
};

export const getTenantDomain = () => normalizeUrl(localStorage.getItem(TENANT_DOMAIN_KEY));

export const clearTenantDomain = () => {
  localStorage.removeItem(TENANT_DOMAIN_KEY);
};

export const getApiBaseUrl = () => getTenantDomain() || DEFAULT_API_BASE_URL;

export const extractTenantDomain = (responseData = {}) => {
  const candidates = [
    responseData?.tenant_domain,
    responseData?.tenantDomain,
    responseData?.domain,
    responseData?.base_url,
    responseData?.api_base_url,
    responseData?.tenant?.domain,
    responseData?.tenant?.base_url,
    responseData?.data?.tenant_domain,
    responseData?.data?.domain,
    responseData?.data?.tenant?.domain,
    responseData?.results?.tenant_domain,
    responseData?.results?.domain,
  ];

  return candidates.map(normalizeUrl).find(Boolean) || null;
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const storeUser = (user) => {
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getAccessToken());
