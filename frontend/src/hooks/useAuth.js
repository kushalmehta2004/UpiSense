import { create } from 'zustand';
import { auth } from '../utils/api';
import { getStoredToken, clearAuthStorage } from '../utils/api';

const TOKEN_KEY = 'upisense_token';
const USER_KEY = 'upisense_user';

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setAuthStorage(user, token, rememberMe) {
  clearAuthStorage();
  const useLocal = rememberMe !== false;
  const storage = useLocal ? localStorage : sessionStorage;
  try {
    if (token) storage.setItem(TOKEN_KEY, token);
    if (user) storage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    // If one storage fails (e.g. private mode), try the other
    const fallback = storage === localStorage ? sessionStorage : localStorage;
    if (token) fallback.setItem(TOKEN_KEY, token);
    if (user) fallback.setItem(USER_KEY, JSON.stringify(user));
  }
}

function setUserInCurrentStorage(user) {
  const inLocal = localStorage.getItem(TOKEN_KEY);
  const storage = inLocal ? localStorage : sessionStorage;
  if (user) storage.setItem(USER_KEY, JSON.stringify(user));
}

export const useAuthStore = create((set) => ({
      user: null,
      token: null,
      loading: true,
      initialized: false,

      setUser: (user, token, rememberMe = true) => {
        // Treat undefined/omitted as "remember me" so localStorage is used
        const useLocal = rememberMe !== false;
        setAuthStorage(user, token, useLocal);
        set({ user, token });
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, token: null });
      },

      init: async () => {
        const token = getStoredToken();
        const stored = getStoredUser();
        if (!token || !stored) {
          set({ loading: false, initialized: true });
          return false;
        }
        try {
          const { data } = await auth.verifyToken();
          if (data.valid) {
            let user = stored;
            try {
              const profileRes = await auth.profile();
              if (profileRes.data?.user) {
                user = profileRes.data.user;
                setUserInCurrentStorage(user);
              }
            } catch (_) {
              // keep stored user if profile fetch fails
            }
            set({ user, token, loading: false, initialized: true });
            return true;
          }
        } catch (err) {
          // Only clear storage on auth failure (401). Don't wipe session on network errors.
          if (err.response?.status === 401) {
            clearAuthStorage();
          }
        }
        set({ user: null, token: null, loading: false, initialized: true });
        return false;
      },

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          const user = { ...state.user, ...updates };
          setUserInCurrentStorage(user);
          return { user };
        });
      },

      setLoading: (loading) => set({ loading }),
}));
