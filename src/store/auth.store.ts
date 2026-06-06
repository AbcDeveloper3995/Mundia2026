import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

type UserRole = 'ADMIN' | 'Participante' | null;

interface AuthState {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, role: null }),
}));
