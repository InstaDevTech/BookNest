import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Spinner } from '../../shared/ui/Spinner.js';
import { useTheme } from '../../shared/context/ThemeContext.js';
import { Header } from './Header.js';

export function Layout() {
    const { theme } = useTheme();

    return (
        <div className="app-shell" data-theme={theme}>
            <Header />

            <main className="page-main">
                <Suspense fallback={<Spinner title="Загружаем страницу..." subtitle="" />}>
                    <Outlet />
                </Suspense>
            </main>

            <footer className="page-footer">
                <p>&copy; 2026 BookNest. Все права защищены.</p>
            </footer>
        </div>
    );
}