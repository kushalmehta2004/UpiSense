import { create } from 'zustand';
import { auth } from '../utils/api';

export const useAuthStore = create((set) => ({
      user: null,
      token: null,
      loading: true,
      initialized: false,

      setUser: (user, token) => {
        if (token) localStorage.setItem('upisense_token', token);
        if (user) localStorage.setItem('upisense_user', JSON.stringify(user));
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('upisense_token');
        localStorage.removeItem('upisense_user');
        set({ user: null, token: null });
      },

      init: async () => {
        const token = localStorage.getItem('upisense_token');
        const stored = localStorage.getItem('upisense_user');
        if (!token || !stored) {
          set({ loading: false, initialized: true });
          return false;
        }
        try {
          const { data } = await auth.verifyToken();
          if (data.valid) {
            const user = JSON.parse(stored);
            set({ user, token, loading: false, initialized: true });
            return true;
          }
        } catch {
          localStorage.removeItem('upisense_token');
          localStorage.removeItem('upisense_user');
        }
        set({ user: null, token: null, loading: false, initialized: true });
        return false;
      },

      setLoading: (loading) => set({ loading }),
}));
