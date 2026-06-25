import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // Crucial for sending/receiving cookies securely
});

api.interceptors.request.use((config) => {
  const storeStr = localStorage.getItem('auth-storage');
  if (storeStr) {
    try {
      const { state } = JSON.parse(storeStr);
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch (e) {
      console.error('Failed to parse auth storage', e);
    }
  }
  return config;
});
