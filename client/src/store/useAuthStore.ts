import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/axios';
import type { AuthUser, AuthResponse, UpdateProfilePayload } from '@code-dual/shared';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; primaryLanguage: string; skillLevel: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  isProfileComplete: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          set({ user: response.data.user, accessToken: response.data.accessToken, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<AuthResponse>('/auth/register', data);
          set({ user: response.data.user, accessToken: response.data.accessToken, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout'); 
        } catch (error) {
          // ignore error on logout
        }
        set({ user: null, accessToken: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const response = await api.post<AuthResponse>('/auth/refresh');
          set({ user: response.data.user, accessToken: response.data.accessToken, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.put<{ user: AuthUser }>('/profile', data);
          set({ user: response.data.user, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to update profile', 
            isLoading: false 
          });
          throw error;
        }
      },

      isProfileComplete: () => {
        const user = get().user;
        return !!(user && user.location && user.mobileNumber);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
