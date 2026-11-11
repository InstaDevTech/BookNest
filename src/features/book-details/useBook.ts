import { useCallback } from 'react';
import { getBookDetails, getSimilarBooks } from '../../api/books.js';
import type { Book, BookDetails } from '../../api/types.js';
import { useFetch, type UseFetchResult } from '../../shared/hooks/useFetch.js';

export interface BookWithSimilar {
    book: BookDetails;
    similar: Book[];
}

export function useBook(bookId: string): UseFetchResult<BookWithSimilar> {
    const fetcher = useCallback(
        async (signal: AbortSignal): Promise<BookWithSimilar> => {
            const book = await getBookDetails(bookId, { signal });
            const similar = await getSimilarBooks(book, { limit: 4, signal }).catch((err: unknown) => {
                if (err instanceof Error && err.name === 'AbortError') throw err;
                return [] as Book[];
            });
            return { book, similar };
        },
        [bookId]
    );

    return useFetch(fetcher);
}
