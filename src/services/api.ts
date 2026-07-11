
import axios from 'axios';

// Detect Environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR ---
// Otomatis menyisipkan Token JWT ke setiap request jika ada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
// Menangani error global, misal Token Expired (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Prevent Loop: Don't logout if the 401 comes from background checks like config or health
      const url = error.config.url || '';
      const isBackgroundCheck = url.includes('/config') || url.includes('/health');

      if (!isBackgroundCheck) {
          // Jika Unauthorized (Token habis/salah), logout paksa di frontend
          // Kecuali jika sedang di halaman login/register
          const path = window.location.pathname;
          if (!path.includes('/login') && !path.includes('/register')) {
              localStorage.removeItem('token');
              localStorage.removeItem('kmp_adng_user');
              // Optional: Redirect to login or show modal
              // window.location.href = '/'; 
          }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
