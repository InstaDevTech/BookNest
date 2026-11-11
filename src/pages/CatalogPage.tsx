import { useState } from 'react';
import type { CatalogViewMode } from '../api/types.js';
import { CatalogContent } from '../features/catalog/CatalogContent.js';
import { FiltersPanel } from '../features/catalog/FiltersPanel.js';
import { MIN_QUERY_LENGTH, useCatalogState } from '../features/catalog/useCatalog.js';
import { useWishlist } from '../features/wishlist/useWishlist.js';
import { getVisibleBooks } from '../shared/lib/books.js';

export function CatalogPage() {
    const catalog = useCatalogState();
    const wishlist = useWishlist();
    const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');

    // Производные данные вычисляются при рендере
    const visibleBooks = getVisibleBooks(
        catalog.books,
        { query: '', genre: '', onlyAvailable: catalog.filters.onlyAvailable },
        catalog.sortBy
    );

    return (
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
                    wishlistIds={wishlist.ids}
                    onViewModeChange={setViewMode}
                    onToggleWishlist={wishlist.toggle}
                    onResetFilters={catalog.handleResetFilters}
                    onRetry={catalog.handleRetry}
                    onPrevPage={catalog.handlePrevPage}
                    onNextPage={catalog.handleNextPage}
                    onLoadMore={catalog.handleLoadMore}
                />
            </div>
        </>
    );
}