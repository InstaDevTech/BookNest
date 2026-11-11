import type { RefObject } from 'react';
import { useTheme } from '../../shared/context/ThemeContext.js';
import { Badge } from '../../shared/ui/Badge.js';
import { Button } from '../../shared/ui/Button.js';

export interface HeaderProps {
    wishlistCount: number;
    isWishlistOpen: boolean;
    activeView: 'catalog' | 'details';
    wishlistButtonRef?: RefObject<HTMLButtonElement | null>;
    onOpenWishlist: () => void;
    onNavigateCatalog: () => void;
    onNavigateDefaultBook: () => void;
}

export function Header({
    wishlistCount,
    isWishlistOpen,
    activeView,
    wishlistButtonRef,
    onOpenWishlist,
    onNavigateCatalog,
    onNavigateDefaultBook,
}: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
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
                    onClick={toggleTheme}
                    aria-label="Переключить цветовую тему"
                >
                    {theme === 'dark' ? '☀ Светлая' : '🌙 Тёмная'}
                </Button>

                <button
                    ref={wishlistButtonRef}
                    type="button"
                    className="btn btn-outline header-wishlist-btn"
                    aria-haspopup="dialog"
                    aria-expanded={isWishlistOpen}
                    onClick={onOpenWishlist}
                >
                    Мой список <Badge variant="accent">{wishlistCount}</Badge>
                </button>
            </div>
        </header>
    );
}
