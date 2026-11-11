import { Link, NavLink, useLocation } from 'react-router-dom';
import { useWishlist } from '../../features/wishlist/useWishlist.js';
import { useAuth } from '../../shared/context/AuthContext.js';
import { useTheme } from '../../shared/context/ThemeContext.js';
import { Badge } from '../../shared/ui/Badge.js';
import { Button } from '../../shared/ui/Button.js';

export function Header() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const wishlist = useWishlist();
    const { pathname } = useLocation();

    // «Каталог» активен и на карточке книги, но не на форме создания
    const isCatalogActive = pathname.startsWith('/books') && pathname !== '/books/new';

    return (
        <header className="page-header">
            <p className="booknest-title">
                <Link to="/books"><strong>BookNest</strong></Link> - Библиотека книг
            </p>
            <nav aria-label="Основная навигация" className="page-header-nav">
                <ul>
                    <li>
                        <Link to="/books" aria-current={isCatalogActive ? 'page' : undefined}>
                            Каталог
                        </Link>
                    </li>
                    <li>
                        <NavLink to="/books/new">Добавить книгу</NavLink>
                    </li>
                    <li>
                        <NavLink to="/wishlist">
                            Мой список <Badge variant="accent">{wishlist.items.length}</Badge>
                        </NavLink>
                    </li>
                    <li>
                        {user ? (
                            <Link to="/login" onClick={logout}>Выйти ({user.name})</Link>
                        ) : (
                            <NavLink to="/login">Войти</NavLink>
                        )}
                    </li>
                </ul>
            </nav>

            <div className="header-controls">
                <Button
                    variant="secondary"
                    size="sm"
                    className="header-wishlist-btn"
                    onClick={toggleTheme}
                    aria-label="Переключить цветовую тему"
                >
                    {theme === 'dark' ? '☀ Светлая' : '🌙 Тёмная'}
                </Button>
            </div>
        </header>
    );
}