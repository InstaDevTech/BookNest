import { Badge } from './Badge.js';
import { BookList } from './BookList.js';
import { Button } from './Button.js';
import { DataTable, type DataTableColumn } from './DataTable.js';
import { EmptyState } from './EmptyState.js';
import { ErrorBox } from './ErrorBox.js';
import { PaginationBar } from './PaginationBar.js';
import { Spinner } from './Spinner.js';
import { GENRES } from '../lib/books.js';
import { ApiError } from '../api/client.js';
import type { Book, CatalogViewMode, UiState } from '../types.js';

export interface CatalogContentProps {
    uiState: UiState;
    error: ApiError | Error | null;
    visibleBooks: readonly Book[];
    totalFound: number;
    page: number;
    totalPages: number;
    isLoadingMore: boolean;
    viewMode: CatalogViewMode;
    wishlistIds: ReadonlySet<string>;
    onViewModeChange: (mode: CatalogViewMode) => void;
    onToggleWishlist: (book: Book) => void;
    onSelectBook: (bookId: string) => void;
    onResetFilters: () => void;
    onRetry: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onLoadMore: () => void;
}

export function CatalogContent({
    uiState,
    error,
    visibleBooks,
    totalFound,
    page,
    totalPages,
    isLoadingMore,
    viewMode,
    wishlistIds,
    onViewModeChange,
    onToggleWishlist,
    onSelectBook,
    onResetFilters,
    onRetry,
    onPrevPage,
    onNextPage,
    onLoadMore,
}: CatalogContentProps) {
    const effectiveUiState: UiState =
        uiState === 'success' && visibleBooks.length === 0 ? 'empty' : uiState;

    const columns: DataTableColumn<Book>[] = [
        {
            key: 'title',
            header: 'Название',
            sortable: true,
            render: (b) => (
                <a href={`#book/${encodeURIComponent(b.id)}`} onClick={(e) => { e.preventDefault(); onSelectBook(b.id); }}>
                    {b.title}
                </a>
            ),
        },
        { key: 'author', header: 'Автор', sortable: true },
        { key: 'genre', header: 'Жанр', sortable: true, render: (b) => GENRES[b.genre] ?? b.genre },
        { key: 'year', header: 'Год', sortable: true },
        { key: 'rating', header: 'Рейтинг', sortable: true, render: (b) => `★ ${b.rating.toFixed(1)}` },
        {
            key: 'available',
            header: 'Статус',
            sortable: true,
            render: (b) => <Badge variant={b.available ? 'success' : 'danger'}>{b.available ? 'В наличии' : 'Нет'}</Badge>,
        },
    ];

    return (
        <section aria-labelledby="books-list-title" className="catalog-content">
            <div className="catalog-content-header">
                <h2 id="books-list-title">Список книг (Open Library API)</h2>
                <div className="catalog-toolbar">
                    <p className="results-count" aria-live="polite">
                        {effectiveUiState === 'loading' && 'Загрузка данных...'}
                        {effectiveUiState === 'error' && 'Ошибка соединения'}
                        {effectiveUiState === 'empty' && 'Найдено книг: 0'}
                        {effectiveUiState === 'success' && `Показано: ${visibleBooks.length} (всего в API: ${totalFound})`}
                    </p>
                    <div className="view-mode-switch">
                        <Button variant={viewMode === 'grid' ? 'primary' : 'secondary'} size="sm" onClick={() => onViewModeChange('grid')}>Сетка</Button>
                        <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} size="sm" onClick={() => onViewModeChange('table')}>Таблица</Button>
                    </div>
                </div>
            </div>

            {effectiveUiState === 'loading' && <Spinner />}
            {effectiveUiState === 'error' && <ErrorBox error={error} onRetry={onRetry} />}
            {effectiveUiState === 'empty' && <EmptyState actionLabel="Сбросить фильтры" onAction={onResetFilters} />}

            {effectiveUiState === 'success' && (
                <div>
                    {viewMode === 'grid' ? (
                        <BookList books={visibleBooks} wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} onSelectBook={onSelectBook} />
                    ) : (
                        <DataTable<Book> items={visibleBooks} columns={columns} getRowKey={(b) => b.id} caption="Таблица книг каталога" />
                    )}
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        isLoading={uiState === 'loading'}
                        isLoadingMore={isLoadingMore}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                        onLoadMore={onLoadMore}
                    />
                </div>
            )}
        </section>
    );
}
