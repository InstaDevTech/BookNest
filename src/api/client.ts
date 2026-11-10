export const BASE_URL = 'https://openlibrary.org';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 1000;

export class ApiError extends Error {
    public readonly status: number;

    constructor(message: string, status = 0) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export interface ApiRequestOptions {
    params?: Record<string, string | number | undefined>;
    signal?: AbortSignal | undefined;
    useCache?: boolean;
    retryOn5xx?: boolean;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true }
            );
        }
    });
}

export function buildUrl(
    endpoint: string,
    params: Record<string, string | number | undefined> = {}
): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${BASE_URL}${cleanEndpoint}`);
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    if (queryString) {
        url.search = queryString;
    }

    return url.toString();
}

export async function apiRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { params = {}, signal, useCache = true, retryOn5xx = true } = options;
    const url = buildUrl(endpoint, params);

    if (useCache && responseCache.has(url)) {
        const cached = responseCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data as T;
        }
        responseCache.delete(url);
    }

    let attempt = 0;
    const maxAttempts = retryOn5xx ? 2 : 1;

    while (attempt < maxAttempts) {
        attempt += 1;

        try {
            const fetchInit: RequestInit = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            };
            if (signal) {
                fetchInit.signal = signal;
            }

            const response = await fetch(url, fetchInit);

            if (!response.ok) {
                if (response.status >= 500 && attempt < maxAttempts) {
                    await delay(800, signal);
                    continue;
                }

                throw new ApiError(
                    `Ошибка HTTP ${response.status}: ${response.statusText || 'Неизвестная ошибка'}`,
                    response.status
                );
            }

            const data = (await response.json()) as T;

            if (useCache) {
                responseCache.set(url, {
                    data,
                    timestamp: Date.now(),
                });
            }

            return data;
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError('Отсутствует соединение с сетью или сервер недоступен', 0);
        }
    }

    throw new ApiError('Не удалось выполнить запрос к API', 0);
}
