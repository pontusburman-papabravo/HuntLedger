import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@huntledger/shared';
import { LocalStorageAuthAdapter } from './LocalStorageAuthAdapter';
import type { AuthAdapter } from './AuthAdapter';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  register: (input: { email: string; name: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// F2: replace with `new FirebaseAuthAdapter()` when VITE_USE_BACKEND === 'true'.
const adapter: AuthAdapter = new LocalStorageAuthAdapter();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    adapter
      .getCurrentSession()
      .then((s) => {
        if (mounted) setUser(s?.user ?? null);
      })
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const session = await adapter.register(input);
    setUser(session.user);
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    const session = await adapter.login(input);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await adapter.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, register, login, logout }),
    [user, isLoading, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
