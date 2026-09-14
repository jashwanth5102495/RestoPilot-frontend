import axios, { AxiosError } from 'axios';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${host}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

const API_URL = getApiBaseUrl();

// Resilient API instance with 30s timeout for weak 2G/3G/4G/Wi-Fi signals
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic Network Retry with Exponential Backoff
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    // Detect network drops, weak signals, timeouts, or transient 5xx server issues
    const isNetworkOrTimeout = !error.response && (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNABORTED' || 
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout')
    );

    const isTransientServerErr = error.response && (error.response.status >= 502 && error.response.status <= 504);

    if (config && (isNetworkOrTimeout || isTransientServerErr)) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < 4) { // Retry up to 4 times silently in the background
        config._retryCount += 1;
        const delayMs = Math.min(1000 * Math.pow(2, config._retryCount), 8000); // 2s, 4s, 8s backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(config);
      }
    }

    // Handle unauthorized errors automatically
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      
      if (window.location.pathname.startsWith('/admin')) {
        sessionStorage.removeItem('adminAuth');
        window.location.href = '/admin/login';
      } else if (!window.location.pathname.includes('/public/') && !window.location.pathname.includes('/table/') && !window.location.pathname.includes('/order/') && !window.location.pathname.includes('/billing/') && !window.location.pathname.includes('/kds/')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
