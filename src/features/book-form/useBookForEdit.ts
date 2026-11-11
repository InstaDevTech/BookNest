import { useCallback } from 'react';
import { getBookForEdit } from '../../api/books.js';
import type { BookInput } from '../../api/types.js';
import { useFetch, type UseFetchResult } from '../../shared/hooks/useFetch.js';

export function useBookForEdit(bookId: string): UseFetchResult<BookInput> {
    const fetcher = useCallback(
        (signal: AbortSignal) => getBookForEdit(bookId, { signal }),
        [bookId]
    );
    return useFetch(fetcher);
}