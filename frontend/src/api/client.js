import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
});

// Phase 2: attach the access token from AuthContext and handle 401 refresh.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayflow-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
