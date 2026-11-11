import { Outlet } from 'react-router-dom';
import { useTheme } from '../../shared/context/ThemeContext.js';
import { Header } from './Header.js';

export function Layout() {
    const { theme } = useTheme();

    return (
        <div className="app-shell" data-theme={theme}>
            <Header />

            <main className="page-main">
                <Outlet />
            </main>

            <footer className="page-footer">
                <p>&copy; 2026 BookNest. Все права защищены.</p>
            </footer>
        </div>
    );
}