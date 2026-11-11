import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CatalogFilters, GenreFilter, SortOption, UiState } from '../../api/types.js';
import { useDebounce } from '../../shared/hooks/useDebounce.js';
import { GENRES } from '../../shared/lib/books.js';
import { DEFAULT_SORT } from '../../shared/lib/storage.js';
import { useBooks } from './useBooks.js';

export const DEBOUNCE_DELAY_MS = 350;
export const MIN_QUERY_LENGTH = 2;

const SORT_OPTIONS: readonly SortOption[] = ['title', 'year', 'rating'];

function parseGenre(raw: string | null): GenreFilter {
    return raw !== null && Object.hasOwn(GENRES, raw) ? (raw as GenreFilter) : '';
}

function parseSort(raw: string | null): SortOption {
    return SORT_OPTIONS.find((option) => option === raw) ?? DEFAULT_SORT;
}

function parsePage(raw: string | null): number {
    const value = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
}

type ParamsPatch = Record<string, string | null>;

/**
 * Состояние каталога хранится в URL: ?q=...&genre=...&sort=...&available=1&page=2.
 * Ссылка на отфильтрованный каталог воспроизводит состояние в любой вкладке.
 */
export function useCatalogState() {
    const [params, setParams] = useSearchParams();

    const query = params.get('q') ?? '';
    const genre = parseGenre(params.get('genre'));
    const sortBy = parseSort(params.get('sort'));
    const onlyAvailable = params.get('available') === '1';
    const page = parsePage(params.get('page'));

    // Накопительная загрузка действует, пока не сменились фильтры: ключ сбрасывает её автоматически
    const filterKey = `|${genre}|${sortBy}`;
    const [appendKey, setAppendKey] = useState<string | null>(null);
    const appendMode = appendKey === filterKey && page > 1;

    const filters = useMemo<CatalogFilters>(
        () => ({ query, genre, onlyAvailable }),
        [query, genre, onlyAvailable]
    );

    const updateParams = useCallback(
        (patch: ParamsPatch, options: { keepPage?: boolean; replace?: boolean } = {}) => {
            setParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(patch).forEach(([key, value]) => {
                        if (value === null || value === '') next.delete(key);
                        else next.set(key, value);
                    });
                    if (!options.keepPage) next.delete('page');
                    return next;
                },
                { replace: options.replace ?? false }
            );
        },
        [setParams]
    );

    // Черновик поискового запроса: в URL попадает после паузы в наборе
    const [searchDraft, setSearchDraft] = useState(query);
    const [syncedQuery, setSyncedQuery] = useState(query);
    if (query !== syncedQuery) {
        // URL изменился извне (кнопка «назад», ссылка) - подтягиваем черновик
        setSyncedQuery(query);
        setSearchDraft(query);
    }

    const trimmedDraft = searchDraft.trim();
    const debouncedDraft = useDebounce(trimmedDraft, DEBOUNCE_DELAY_MS);

    useEffect(() => {
        const isSettled = debouncedDraft === trimmedDraft;
        const isValid = trimmedDraft.length === 0 || trimmedDraft.length >= MIN_QUERY_LENGTH;
        if (isSettled && isValid && trimmedDraft !== query) {
            updateParams({ q: trimmedDraft }, { replace: true });
        }
    }, [debouncedDraft, trimmedDraft, query, updateParams]);

    const { data, error, status, reload } = useBooks({
        query,
        genre,
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

    const handleGenreChange = (next: GenreFilter) => {
        updateParams({ genre: next });
    };

    const handleSortChange = (sort: SortOption) => {
        updateParams({ sort: sort === DEFAULT_SORT ? null : sort });
    };

    const handleAvailableChange = (next: boolean) => {
        updateParams({ available: next ? '1' : null });
    };

    const handleSubmitSearch = () => {
        if (trimmedDraft.length === 0 || trimmedDraft.length >= MIN_QUERY_LENGTH) {
            updateParams({ q: trimmedDraft });
        }
    };

    const handleResetFilters = () => {
        setSearchDraft('');
        setParams(new URLSearchParams());
    };

    const goToPage = (next: number, append: boolean) => {
        setAppendKey(append ? filterKey : null);
        updateParams({ page: next > 1 ? String(next) : null }, { keepPage: true });
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
        handlePrevPage: () => goToPage(Math.max(1, page - 1), false),
        handleNextPage: () => goToPage(Math.min(totalPages, page + 1), false),
        handleLoadMore: () => goToPage(Math.min(totalPages, page + 1), true),
    };
}
