import { create } from 'zustand';
import { getCurrentUser, logout as authLogout } from '../services/authService';

interface User {
  id: string | number;
  username: string;
  email?: string;
  fullName?: string;
  token?: string;
  role?: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,
  
  logout: () => {
    authLogout();
    set({ user: null });
  },
  
  loadUser: async () => {
    set({ loading: true, error: null });
    try {
      const user = getCurrentUser();
      set({ user, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },
}));

// Initialize user on import
if (typeof window !== 'undefined') {
  useUserStore.getState().loadUser();
} 