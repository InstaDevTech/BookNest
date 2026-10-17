import { useEffect, useState } from 'react';
import { PAGE_LIMIT, searchBooks } from '../api/books.js';
import { ApiError } from '../api/client.js';
import { DEFAULT_FILTERS, DEFAULT_SORT, loadInitialSettings, saveSettings } from './storage.js';
import type { Book, CatalogFilters, GenreFilter, SortOption, UiState } from '../types.js';

export const DEBOUNCE_DELAY_MS = 350;
export const MIN_QUERY_LENGTH = 2;

export function useCatalogState() {
    const initial = loadInitialSettings();
    const [books, setBooks] = useState<Book[]>([]);
    const [uiState, setUiState] = useState<UiState>('loading');
    const [error, setError] = useState<ApiError | Error | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFound, setTotalFound] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [appendMode, setAppendMode] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const [searchDraft, setSearchDraft] = useState(initial.filters.query);
    const [filters, setFilters] = useState<CatalogFilters>(initial.filters);
    const [sortBy, setSortBy] = useState<SortOption>(initial.sortBy);

    useEffect(() => {
        const trimmed = searchDraft.trim();
        if (trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH) {
            return;
        }
        const timerId = setTimeout(() => {
            setFilters((prev) => {
                if (prev.query === trimmed) return prev;
                setPage(1);
                setAppendMode(false);
                return { ...prev, query: trimmed };
            });
        }, DEBOUNCE_DELAY_MS);

        return () => clearTimeout(timerId);
    }, [searchDraft]);

    useEffect(() => {
        saveSettings(filters, sortBy);
    }, [filters, sortBy]);

    useEffect(() => {
        const controller = new AbortController();
        let isAborted = false;

        async function fetchCatalog() {
            if (appendMode) {
                setIsLoadingMore(true);
            } else {
                setUiState('loading');
            }
            setError(null);

            let nextState: UiState = 'loading';
            let caughtErr: ApiError | Error | null = null;

            try {
                const res = await searchBooks({
                    query: filters.query,
                    genre: filters.genre,
                    sort: sortBy,
                    page,
                    limit: PAGE_LIMIT,
                    signal: controller.signal,
                });

                setTotalFound(res.totalFound);
                setTotalPages(res.totalPages);
                setBooks((prev) => {
                    if (!appendMode) return res.books;
                    const existing = new Set(prev.map((b) => b.id));
                    const fresh = res.books.filter((b) => !existing.has(b.id));
                    return [...prev, ...fresh];
                });
                nextState = res.books.length > 0 || appendMode ? 'success' : 'empty';
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    isAborted = true;
                    return;
                }
                caughtErr = err instanceof Error ? err : new ApiError('Ошибка сети', 0);
                nextState = 'error';
            } finally {
                if (!isAborted) {
                    setError(caughtErr);
                    setUiState(nextState);
                    setIsLoadingMore(false);
                }
            }
        }

        void fetchCatalog();
        return () => controller.abort();
    }, [filters.query, filters.genre, sortBy, page, appendMode, reloadKey]);

    const handleGenreChange = (genre: GenreFilter) => {
        setPage(1);
        setAppendMode(false);
        setFilters((p) => ({ ...p, genre }));
    };

    const handleSortChange = (sort: SortOption) => {
        setPage(1);
        setAppendMode(false);
        setSortBy(sort);
    };

    const handleAvailableChange = (onlyAvailable: boolean) => {
        setFilters((p) => ({ ...p, onlyAvailable }));
    };

    const handleSubmitSearch = () => {
        const trimmed = searchDraft.trim();
        if (trimmed.length === 0 || trimmed.length >= MIN_QUERY_LENGTH) {
            setPage(1);
            setAppendMode(false);
            setFilters((p) => ({ ...p, query: trimmed }));
        }
    };

    const handleResetFilters = () => {
        setSearchDraft('');
        setFilters(DEFAULT_FILTERS);
        setSortBy(DEFAULT_SORT);
        setPage(1);
        setAppendMode(false);
    };

    return {
        books,
        uiState,
        error,
        page,
        totalPages,
        totalFound,
        isLoadingMore,
        searchDraft,
        filters,
        sortBy,
        setSearchDraft,
        handleGenreChange,
        handleSortChange,
        handleAvailableChange,
        handleSubmitSearch,
        handleResetFilters,
        handleRetry: () => setReloadKey((k) => k + 1),
        handlePrevPage: () => { setAppendMode(false); setPage((p) => Math.max(1, p - 1)); },
        handleNextPage: () => { setAppendMode(false); setPage((p) => Math.min(totalPages, p + 1)); },
        handleLoadMore: () => { setAppendMode(true); setPage((p) => Math.min(totalPages, p + 1)); },
    };
}
