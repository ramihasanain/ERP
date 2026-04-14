import axios from 'axios';
import { getApiBaseUrl, removeTokens, clearTenantDomain } from '@/services/auth';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeTokens();
      clearTenantDomain();
    }
    return Promise.reject(error);
  }
);

export const get = async (url, config = {}) => {
  const response = await apiClient.get(url, config);
  return response.data;
};

export const post = async (url, data = {}, config = {}) => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};

export const patch = async (url, data = {}, config = {}) => {
  const response = await apiClient.patch(url, data, config);
  return response.data;
};

export const remove = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};

export default apiClient;
