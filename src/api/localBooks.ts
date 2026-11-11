import { ApiError, apiRequest, LOCAL_API_URL } from './client.js';
import type { BookInput, StoredBook } from './types.js';

const LOCAL_ID_PREFIX = 'local-';

export function isLocalBookId(id: string): boolean {
    return id.startsWith(LOCAL_ID_PREFIX);
}

function bookEndpoint(id?: string): string {
    return id ? `/stub-api/books/${encodeURIComponent(id)}` : '/stub-api/books';
}

/** Книга из собственного backend; null, если записи нет (404) */
export async function findLocalBook(id: string, signal?: AbortSignal): Promise<StoredBook | null> {
    try {
        return await apiRequest<StoredBook>(bookEndpoint(id), {
            baseUrl: LOCAL_API_URL,
            useCache: false,
            signal,
        });
    } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }
}

export function createBook(input: BookInput): Promise<StoredBook> {
    return apiRequest<StoredBook>(bookEndpoint(), {
        method: 'POST',
        body: input,
        baseUrl: LOCAL_API_URL,
    });
}

export function updateBook(id: string, input: BookInput): Promise<StoredBook> {
    return apiRequest<StoredBook>(bookEndpoint(id), {
        method: 'PUT',
        body: input,
        baseUrl: LOCAL_API_URL,
    });
}