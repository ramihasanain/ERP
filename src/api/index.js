import axios from 'axios';
import {
  getApiBaseUrl,
  getAccessToken,
  getRefreshToken,
  removeTokens,
  clearTenantDomain,
  persistAuthSession,
} from '@/services/auth';

/** Django REST SimpleJWT-style path relative to `getApiBaseUrl()`. */
export const TOKEN_REFRESH_PATH = '/api/token/refresh/';

let refreshPromise = null;

/**
 * POST refresh; uses a plain axios call (not `apiClient`) to avoid interceptor loops.
 * On HTTP 200, reads new access (and refresh if rotated) and persists them in one write.
 */
export const postTokenRefresh = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('Missing refresh token');

  const response = await axios.post(
    `${getApiBaseUrl()}${TOKEN_REFRESH_PATH}`,
    { refresh },
    {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    }
  );

  if (response.status !== 200) {
    throw new Error(
      response.data?.detail || response.data?.message || 'Refresh token rejected'
    );
  }

  const data = response.data;
  const access = data?.access || data?.access_token;
  const nextRefresh = data?.refresh || data?.refresh_token || refresh;
  if (!access) throw new Error('Invalid refresh response');

  persistAuthSession({ access, refresh: nextRefresh });
};

const isRefreshRequest = (config) => {
  const path = `${config?.baseURL || ''}${config?.url || ''}`;
  return path.includes('token/refresh');
};

/** Do not chain refresh on credential endpoints (wrong password still returns 401). */
const isCredentialsAuthRequest = (config) => {
  const path = `${config?.baseURL || ''}${config?.url || ''}`.toLowerCase();
  return (
    path.includes('/login/') ||
    path.includes('/register/') ||
    path.endsWith('/login') ||
    path.endsWith('/register')
  );
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const canTryRefresh =
      !originalRequest._retry &&
      !isRefreshRequest(originalRequest) &&
      !isCredentialsAuthRequest(originalRequest) &&
      Boolean(getRefreshToken());

    if (canTryRefresh) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = postTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        originalRequest.baseURL = getApiBaseUrl();
        const newAccess = getAccessToken();
        if (newAccess && originalRequest.headers) {
          const h = originalRequest.headers;
          if (typeof h.set === 'function') {
            h.set('Authorization', `Bearer ${newAccess}`);
          } else {
            h.Authorization = `Bearer ${newAccess}`;
          }
        }
        return apiClient.request(originalRequest);
      } catch {
        removeTokens();
        clearTenantDomain();
        return Promise.reject(error);
      }
    }

    removeTokens();
    clearTenantDomain();
    return Promise.reject(error);
  }
);

export const get = async (url, config = {}) => {
  const response = await apiClient.get(url, config);
  return response.data;
};

export const post = async (url, data = {}, config = {}) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const resolvedConfig = isFormData
    ? {
        ...config,
        headers: {
          ...(config.headers || {}),
          'Content-Type': undefined,
        },
      }
    : config;

  const response = await apiClient.post(url, data, resolvedConfig);
  return response.data;
};

export const patch = async (url, data = {}, config = {}) => {
  const response = await apiClient.patch(url, data, config);
  return response.data;
};

export const put = async (url, data = {}, config = {}) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const resolvedConfig = isFormData
    ? {
        ...config,
        headers: {
          ...(config.headers || {}),
          'Content-Type': undefined,
        },
      }
    : config;

  const response = await apiClient.put(url, data, resolvedConfig);
  return response.data;
};

export const remove = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};

export default apiClient;
