import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // For HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  // Token will be sent via cookie, but we can also check localStorage if needed
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're on a protected page (not on login or public pages)
      if (typeof window !== 'undefined') {
        const publicPaths = ['/login', '/', '/halls'];
        const isPublic = publicPaths.some((p) => window.location.pathname === p);
        if (!isPublic) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

