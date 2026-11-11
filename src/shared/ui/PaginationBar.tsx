import { Button } from './Button.js';

export interface PaginationBarProps {
    page: number;
    totalPages: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    onLoadMore: () => void;
}

export function PaginationBar({
    page,
    totalPages,
    isLoading,
    isLoadingMore,
    onPrevPage,
    onNextPage,
    onLoadMore,
}: PaginationBarProps) {
    const hasMore = page < totalPages;

    return (
        <nav className="pagination-bar" aria-label="Пагинация каталога">
            <div className="pagination-buttons">
                <Button
                    variant="secondary"
                    className="pagination-btn"
                    disabled={page <= 1 || isLoading}
                    onClick={onPrevPage}
                >
                    &larr; Назад
                </Button>

                <span className="pagination-info" aria-live="polite">
                    Страница {page} из {totalPages}
                </span>

                <Button
                    variant="secondary"
                    className="pagination-btn"
                    disabled={!hasMore || isLoading}
                    onClick={onNextPage}
                >
                    Вперёд &rarr;
                </Button>
            </div>

            {hasMore && (
                <Button
                    variant="outline"
                    className="load-more-btn"
                    disabled={isLoadingMore || isLoading}
                    onClick={onLoadMore}
                >
                    {isLoadingMore ? 'Загружаем ещё...' : 'Показать ещё 20 книг'}
                </Button>
            )}
        </nav>
    );
}
