import { useEffect, useState } from 'react';
import { useBooks } from '../hooks/useBooks.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { DEFAULT_FILTERS, DEFAULT_SORT, loadInitialSettings, saveSettings } from './storage.js';
import type { CatalogFilters, GenreFilter, SortOption, UiState } from '../types.js';

export const DEBOUNCE_DELAY_MS = 350;
export const MIN_QUERY_LENGTH = 2;

export function useCatalogState() {
    const initial = loadInitialSettings();
    const [page, setPage] = useState(1);
    const [appendMode, setAppendMode] = useState(false);

    const [searchDraft, setSearchDraft] = useState(initial.filters.query);
    const [filters, setFilters] = useState<CatalogFilters>(initial.filters);
    const [sortBy, setSortBy] = useState<SortOption>(initial.sortBy);

    // Поисковый запрос применяется после паузы в наборе; слишком короткий запрос игнорируется
    const debouncedDraft = useDebounce(searchDraft.trim(), DEBOUNCE_DELAY_MS);
    const [appliedDraft, setAppliedDraft] = useState(debouncedDraft);
    if (debouncedDraft !== appliedDraft) {
        setAppliedDraft(debouncedDraft);
        if (debouncedDraft.length === 0 || debouncedDraft.length >= MIN_QUERY_LENGTH) {
            setPage(1);
            setAppendMode(false);
            setFilters((prev) => (prev.query === debouncedDraft ? prev : { ...prev, query: debouncedDraft }));
        }
    }

    useEffect(() => {
        saveSettings(filters, sortBy);
    }, [filters, sortBy]);

    const { data, error, status, reload } = useBooks({
        query: filters.query,
        genre: filters.genre,
        sort: sortBy,
        page,
        append: appendMode,
    });

    const books = data?.books ?? [];
    const totalPages = data?.totalPages ?? 1;
    const totalFound = data?.totalFound ?? 0;
    const isLoadingMore = appendMode && status === 'loading' && data !== null;
    const uiState: UiState =
        status === 'error' ? 'error'
        : isLoadingMore ? 'success'
        : status === 'loading' ? 'loading'
        : books.length === 0 ? 'empty'
        : 'success';
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
        handleRetry: reload,
        handlePrevPage: () => { setAppendMode(false); setPage((p) => Math.max(1, p - 1)); },
        handleNextPage: () => { setAppendMode(false); setPage((p) => Math.min(totalPages, p + 1)); },
        handleLoadMore: () => { setAppendMode(true); setPage((p) => Math.min(totalPages, p + 1)); },
    };
}

