import { useEffect, useRef, useState } from 'react';
import { BookDetailsView } from '../features/book-details/BookDetailsView.js';
import { CatalogContent } from '../features/catalog/CatalogContent.js';
import { FiltersPanel } from '../features/catalog/FiltersPanel.js';
import { Header } from './layout/Header.js';
import { Modal } from '../shared/ui/Modal.js';
import { WishlistContent } from '../features/wishlist/WishlistContent.js';
import { getVisibleBooks } from '../shared/lib/books.js';
import {
    loadInitialWishlist,
    saveWishlist,
} from '../shared/lib/storage.js';
import { MIN_QUERY_LENGTH, useCatalogState } from '../features/catalog/useCatalog.js';
import { useTheme } from '../shared/context/ThemeContext.js';
import type { CatalogViewMode, WishlistItem } from '../api/types.js';

export function App() {
    const wishlistBtnRef = useRef<HTMLButtonElement | null>(null);
    const catalog = useCatalogState();

    const [wishlist, setWishlist] = useState<WishlistItem[]>(loadInitialWishlist);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

    useEffect(() => {
        saveWishlist(wishlist);
    }, [wishlist]);

    // Производные данные вычисляются при рендере
    const visibleBooks = getVisibleBooks(
        catalog.books,
        { query: '', genre: '', onlyAvailable: catalog.filters.onlyAvailable },
        catalog.sortBy
    );
    const wishlistIds = new Set(wishlist.map((item) => item.id));

    const handleToggleWishlist = (item: { id: string; title: string; author: string }) => {
        setWishlist((prev) =>
            prev.some((w) => w.id === item.id)
                ? prev.filter((w) => w.id !== item.id)
                : [...prev, { id: item.id, title: item.title, author: item.author }]
        );
    };

    return (
        <div className="app-shell" data-theme={theme}>
            <Header
                wishlistCount={wishlist.length}
                isWishlistOpen={isWishlistOpen}
                activeView={selectedBookId ? 'details' : 'catalog'}
                wishlistButtonRef={wishlistBtnRef}
                onOpenWishlist={() => setIsWishlistOpen(true)}
                onNavigateCatalog={() => setSelectedBookId(null)}
                onNavigateDefaultBook={() => setSelectedBookId('OL166894W')}
            />

            <main className="page-main">
                {selectedBookId ? (
                    <BookDetailsView
                        bookId={selectedBookId}
                        isInWishlist={wishlistIds.has(selectedBookId)}
                        onToggleWishlist={handleToggleWishlist}
                        onSelectBook={setSelectedBookId}
                        onBackToCatalog={() => setSelectedBookId(null)}
                    />
                ) : (
                    <>
                        <h1>Каталог книг</h1>
                        <div className="catalog-layout">
                            <FiltersPanel
                                searchDraft={catalog.searchDraft}
                                filters={catalog.filters}
                                sortBy={catalog.sortBy}
                                minQueryLength={MIN_QUERY_LENGTH}
                                onSearchDraftChange={catalog.setSearchDraft}
                                onGenreChange={catalog.handleGenreChange}
                                onSortChange={catalog.handleSortChange}
                                onAvailableChange={catalog.handleAvailableChange}
                                onSubmitSearch={catalog.handleSubmitSearch}
                                onReset={catalog.handleResetFilters}
                            />

                            <CatalogContent
                                uiState={catalog.uiState}
                                error={catalog.error}
                                visibleBooks={visibleBooks}
                                totalFound={catalog.totalFound}
                                page={catalog.page}
                                totalPages={catalog.totalPages}
                                isLoadingMore={catalog.isLoadingMore}
                                viewMode={viewMode}
                                wishlistIds={wishlistIds}
                                onViewModeChange={setViewMode}
                                onToggleWishlist={handleToggleWishlist}
                                onSelectBook={setSelectedBookId}
                                onResetFilters={catalog.handleResetFilters}
                                onRetry={catalog.handleRetry}
                                onPrevPage={catalog.handlePrevPage}
                                onNextPage={catalog.handleNextPage}
                                onLoadMore={catalog.handleLoadMore}
                            />
                        </div>
                    </>
                )}
            </main>

            <Modal
                isOpen={isWishlistOpen}
                title="Мой список желаемого"
                returnFocusRef={wishlistBtnRef}
                onClose={() => setIsWishlistOpen(false)}
            >
                <WishlistContent
                    items={wishlist}
                    onRemove={(id) => setWishlist((prev) => prev.filter((item) => item.id !== id))}
                    onSelectBook={setSelectedBookId}
                    onClose={() => setIsWishlistOpen(false)}
                />
            </Modal>

            <footer className="page-footer">
                <p>&copy; 2026 BookNest. Все права защищены.</p>
            </footer>
        </div>
    );
}
