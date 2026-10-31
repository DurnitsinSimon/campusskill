import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { TOKEN_KEY } from '../api/client';
import type { AuthResponse, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const { data: user, isPending } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!token,
    staleTime: Infinity,
  });

  const signIn = useCallback(
    ({ accessToken, user }: AuthResponse) => {
      localStorage.setItem(TOKEN_KEY, accessToken);
      queryClient.setQueryData(['me'], user);
      setToken(accessToken);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener('auth:logout', signOut);
    return () => window.removeEventListener('auth:logout', signOut);
  }, [signOut]);

  const value = useMemo(
    () => ({
      user: token ? (user ?? null) : null,
      isLoading: !!token && isPending,
      signIn,
      signOut,
    }),
    [token, user, isPending, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth нужно вызывать внутри AuthProvider');
  return context;
}