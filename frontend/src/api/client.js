import axios from 'axios';
import { getAccessToken, reportAuthFailure, setAccessToken } from './tokenStore.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

function isAuthEndpoint(url = '') {
  return /\/auth\/(signin|signup|refresh|logout|verify-email)/.test(url);
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || !config || config._retried || isAuthEndpoint(config.url)) {
      throw error;
    }

    config._retried = true;
    try {
      refreshPromise ??= apiClient.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      const { data } = await refreshPromise;
      setAccessToken(data.data.accessToken);
      config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return apiClient(config);
    } catch (refreshError) {
      setAccessToken(null);
      reportAuthFailure();
      throw refreshError;
    }
  }
);
