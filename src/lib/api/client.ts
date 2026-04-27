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

// Response Interceptor: Global Error Handling & Refresh Flow
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized & Token Expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite refresh loops
      if (originalRequest.url?.includes('/users/refresh-token') || originalRequest.url?.includes('/users/login')) {
         return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log("Attempting token refresh...");
        const { data } = await axios.get(`${baseURL}/users/refresh-token`, { 
          withCredentials: true 
        });

        if (data.accessToken) {
          // Update local storage for next requests
          const authStorage = localStorage.getItem('slook-auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            parsed.state.user = { ...parsed.state.user, token: data.accessToken };
            localStorage.setItem('slook-auth-storage', JSON.stringify(parsed));
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed. Redirecting to login...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('slook-auth-storage');
          if (!window.location.pathname.includes('/login')) {
             window.location.href = `/login?callbackUrl=${window.location.pathname}`;
          }
        }
      }
    }

    // Standardize error log for debugging
    if (process.env.NODE_ENV === 'development') {
        const isTimeout = error.message?.includes('timeout');
        const isNetworkError = error.message === 'Network Error';
        const isBackground = error.config?.url?.includes('/notifications') || error.config?.url?.includes('/marketing/flash-sale');

        if (isTimeout || isNetworkError || isBackground) {
            console.warn(`[API ${isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK ERROR' : 'QUIET ERROR'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        } else {
            const data = error.response?.data;
            const message = data?.message || data?.error || error.message;
            console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
        }
    }
    
    return Promise.reject(error);
  }
);

export default client;
