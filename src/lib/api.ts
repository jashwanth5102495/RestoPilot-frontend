import axios from 'axios';
import * as Sentry from '@sentry/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors automatically
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      if (window.location.pathname.startsWith('/admin')) {
        sessionStorage.removeItem('adminAuth');
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    
    // Capture unexpected API errors in Sentry
    const status = error.response ? error.response.status : null;
    if (!status || status >= 500) {
      Sentry.withScope((scope) => {
        if (error.response) {
          scope.setExtra('responseBody', error.response.data);
          scope.setExtra('statusCode', error.response.status);
        }
        scope.setExtra('requestUrl', error.config?.url);
        scope.setExtra('requestMethod', error.config?.method);
        // Do not log request headers (might contain token) or request body (might contain PII) unless sanitized
        
        Sentry.captureException(error);
      });
    }

    return Promise.reject(error);
  }
);
