import { useCallback } from 'react';
import { getBookDetails, getSimilarBooks, PAGE_LIMIT, searchBooks } from '../api/books.js';
import type { Book, BookDetails, GenreFilter, SortOption } from '../types.js';
import { useFetch, type UseFetchResult } from './useFetch.js';

export interface UseBooksParams {
    query: string;
    genre: GenreFilter;
    sort: SortOption;
    page: number;
    /** Накопительный режим: возвращает книги страниц 1..page ("Показать ещё") */
    append: boolean;
}

export interface BooksPage {
    books: Book[];
    totalFound: number;
    totalPages: number;
}

export function useBooks({ query, genre, sort, page, append }: UseBooksParams): UseFetchResult<BooksPage> {
    const fetcher = useCallback(
        async (signal: AbortSignal): Promise<BooksPage> => {
            const firstPage = append ? 1 : page;
            const results = [];
            for (let p = firstPage; p <= page; p += 1) {
                results.push(await searchBooks({ query, genre, sort, page: p, limit: PAGE_LIMIT, signal }));
            }
            const last = results[results.length - 1];
            if (!last) return { books: [], totalFound: 0, totalPages: 1 };

            const seen = new Set<string>();
            const books = results.flatMap((r) => r.books).filter((b) => !seen.has(b.id) && seen.add(b.id));
            return { books, totalFound: last.totalFound, totalPages: last.totalPages };
        },
        [query, genre, sort, page, append]
    );

    return useFetch(fetcher);
}

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
