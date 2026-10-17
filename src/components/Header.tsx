import type { ThemeMode } from '../types.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';

export interface HeaderProps {
    wishlistCount: number;
    isWishlistOpen: boolean;
    activeView: 'catalog' | 'details';
    theme: ThemeMode;
    onOpenWishlist: () => void;
    onNavigateCatalog: () => void;
    onNavigateDefaultBook: () => void;
    onToggleTheme: () => void;
}

export function Header({
    wishlistCount,
    isWishlistOpen,
    activeView,
    theme,
    onOpenWishlist,
    onNavigateCatalog,
    onNavigateDefaultBook,
    onToggleTheme,
}: HeaderProps) {
    return (
        <header className="page-header">
            <p className="booknest-title">
                <strong>BookNest</strong> - Библиотека книг
            </p>
            <nav aria-label="Основная навигация" className="page-header-nav">
                <ul>
                    <li>
                        <a
                            href="#catalog"
                            aria-current={activeView === 'catalog' ? 'page' : undefined}
                            onClick={(event) => {
                                event.preventDefault();
                                onNavigateCatalog();
                            }}
                        >
                            Каталог
                        </a>
                    </li>
                    <li>
                        <a
                            href="#book/OL166894W"
                            aria-current={activeView === 'details' ? 'page' : undefined}
                            onClick={(event) => {
                                event.preventDefault();
                                onNavigateDefaultBook();
                            }}
                        >
                            Карточка книги
                        </a>
                    </li>
                    <li>
                        <a href="loan.html">Выдача книги</a>
                    </li>
                </ul>
            </nav>

            <div className="header-controls">
                <Button
                    variant="secondary"
                    size="sm"
                    className="header-wishlist-btn"
                    onClick={onToggleTheme}
                    aria-label="Переключить цветовую тему"
                >
                    {theme === 'dark' ? '☀ Светлая' : '🌙 Тёмная'}
                </Button>

                <Button
                    variant="outline"
                    className="header-wishlist-btn"
                    aria-haspopup="dialog"
                    aria-expanded={isWishlistOpen}
                    onClick={onOpenWishlist}
                >
                    Мой список <Badge variant="accent">{wishlistCount}</Badge>
                </Button>
            </div>
        </header>
    );
}
