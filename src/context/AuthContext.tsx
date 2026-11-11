import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadFromStorage, saveToStorage } from '../lib/storage.js';

export interface CurrentUser {
    name: string;
}

interface AuthContextValue {
    user: CurrentUser | null;
    isAuthenticated: boolean;
    /** Заглушка: реальная авторизация будет добавлена в ЛР 9 */
    login: (name: string) => void;
    logout: () => void;
}

const STORAGE_KEY_USER = 'booknest_user_stub_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(() => loadFromStorage<CurrentUser | null>(STORAGE_KEY_USER, null));

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            login: (name) => {
                const next = { name };
                setUser(next);
                saveToStorage(STORAGE_KEY_USER, next);
            },
            logout: () => {
                setUser(null);
                saveToStorage(STORAGE_KEY_USER, null);
            },
        }),
        [user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
    return ctx;
}
