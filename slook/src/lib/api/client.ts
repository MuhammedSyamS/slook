import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export const client = axios.create({
  baseURL,
  timeout: 60000, // Increased to 60s for heavy admin dashboard and notification fetches
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('slook-auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const token = state?.user?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("API Auth Header Error:", err);
      }
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Global Error Handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        console.warn("Session expired or invalid. Logging out...");
        localStorage.removeItem('slook-auth-storage');
        // Avoid infinite redirect loops if already on login
        if (!window.location.pathname.includes('/login')) {
           window.location.href = `/login?callbackUrl=${window.location.pathname}`;
        }
      }
    }

    // Standardize error log for debugging without spamming
    if (process.env.NODE_ENV === 'development') {
        const isTimeout = error.message?.includes('timeout');
        const isBackground = error.config?.url?.includes('/notifications');

        if (isTimeout || isBackground) {
            console.warn(`[API ${isTimeout ? 'TIMEOUT' : 'QUIET ERROR'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        } else {
            const data = error.response?.data;
            const message = data?.message || data?.error || error.message;
            const details = data?.errors ? ` | Details: ${JSON.stringify(data.errors)}` : '';
            console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, `${message}${details}`);
        }
    }
    
    return Promise.reject(error);
  }
);

export default client;
