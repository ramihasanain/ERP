const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const TENANT_DOMAIN_KEY = 'tenant_domain';
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const readAuthBlob = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeAuthBlob = (blob) => {
  if (!blob || typeof blob !== 'object') {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(blob));
};

/** Merge flat legacy token keys into `auth_user` and remove duplicates. */
export const migrateLegacyTokenStorage = () => {
  const flatAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
  const flatRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!flatAccess && !flatRefresh) return;

  const blob = readAuthBlob() || {};
  if (flatAccess && !blob.access_token && !blob.access) {
    blob.access_token = flatAccess;
  }
  if (flatRefresh && !blob.refresh_token && !blob.refresh) {
    blob.refresh_token = flatRefresh;
  }
  writeAuthBlob(blob);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const setAccessToken = (access) => {
  if (!access) return;
  const blob = readAuthBlob() || {};
  blob.access_token = access;
  delete blob.access;
  writeAuthBlob(blob);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const setRefreshToken = (refresh) => {
  if (!refresh) return;
  const blob = readAuthBlob() || {};
  blob.refresh_token = refresh;
  delete blob.refresh;
  writeAuthBlob(blob);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const storeTokens = ({ access, refresh }) => {
  if (access) setAccessToken(access);
  if (refresh) setRefreshToken(refresh);
};

/** Single write: user/session fields + tokens live only under `auth_user`. */
export const persistAuthSession = (session = {}) => {
  const {
    access,
    refresh,
    access_token: accessTokenField,
    refresh_token: refreshTokenField,
    ...rest
  } = session;

  const resolvedAccess = access ?? accessTokenField;
  const resolvedRefresh = refresh ?? refreshTokenField;

  const blob = {
    ...readAuthBlob(),
    ...rest,
    ...(resolvedAccess != null && resolvedAccess !== ''
      ? { access_token: resolvedAccess }
      : {}),
    ...(resolvedRefresh != null && resolvedRefresh !== ''
      ? { refresh_token: resolvedRefresh }
      : {}),
  };
  delete blob.access;
  delete blob.refresh;
  writeAuthBlob(blob);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const removeTokens = () => {
  const blob = readAuthBlob();
  if (!blob) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  const next = { ...blob };
  delete next.access_token;
  delete next.refresh_token;
  delete next.access;
  delete next.refresh;
  writeAuthBlob(Object.keys(next).length ? next : null);
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

export const getAccessToken = () => {
  migrateLegacyTokenStorage();
  const blob = readAuthBlob();
  if (!blob) return localStorage.getItem(ACCESS_TOKEN_KEY);
  return blob.access_token || blob.access || null;
};

export const getRefreshToken = () => {
  migrateLegacyTokenStorage();
  const blob = readAuthBlob();
  if (!blob) return localStorage.getItem(REFRESH_TOKEN_KEY);
  return blob.refresh_token || blob.refresh || null;
};

export const storeUser = (user) => {
  if (!user) return;
  const blob = readAuthBlob() || {};
  Object.assign(blob, user);
  writeAuthBlob(blob);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const TOKEN_FIELD_NAMES = new Set([
  'access_token',
  'refresh_token',
  'access',
  'refresh',
]);

export const getStoredUser = () => {
  migrateLegacyTokenStorage();
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;

  try {
    const parsed = JSON.parse(user);
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.user && typeof parsed.user === 'object') {
      const resolvedRole = parsed.user.role || parsed.role || (parsed.is_superuser ? 'admin' : null);
      const resolvedName = parsed.user.name || parsed.user.full_name || 'User';

      return {
        ...parsed.user,
        role: resolvedRole,
        name: resolvedName,
      };
    }

    const rest = { ...parsed };
    for (const k of TOKEN_FIELD_NAMES) {
      delete rest[k];
    }
    return rest;
  } catch {
    return null;
  }
};

export const getPermissionsList = () => {
  const blob = readAuthBlob();
  if (Array.isArray(blob?.permissions_list)) return blob.permissions_list;
  return [];
};

export const isAuthenticated = () => Boolean(getAccessToken());
