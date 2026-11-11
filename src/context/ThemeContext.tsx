import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadInitialTheme, saveTheme } from '../lib/storage.js';
import type { ThemeMode } from '../types.js';

interface ThemeContextValue {
    theme: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);

    useEffect(() => {
        saveTheme(theme);
    }, [theme]);

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider');
    return ctx;
}
