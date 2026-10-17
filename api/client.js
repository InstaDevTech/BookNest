// Базовый URL API Open Library в одном месте
export const BASE_URL = 'https://openlibrary.org';

// Кэш ответов на 60 секунд по ключу запроса
const responseCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

// Пользовательский класс ошибки API с HTTP-статусом
export class ApiError extends Error {
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Пауза перед повторной попыткой запроса
function delay(ms, signal) {
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

// Сборка полного URL с query-параметрами через URLSearchParams
export function buildUrl(endpoint, params = {}) {
    const base = window.__BOOKNEST_API_BASE_URL || BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${base}${cleanEndpoint}`);
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    if (queryString) {
        url.search = queryString;
    }

    return url.toString();
}

// Очистка кэша (для тестирования или принудительного обновления)
export function clearApiCache() {
    responseCache.clear();
}

// Универсальная функция выполнения GET-запроса к API
export async function apiRequest(endpoint, { params = {}, signal, useCache = true, retryOn5xx = true } = {}) {
    const url = buildUrl(endpoint, params);

    if (useCache && responseCache.has(url)) {
        const cached = responseCache.get(url);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
        responseCache.delete(url);
    }

    let attempt = 0;
    const maxAttempts = retryOn5xx ? 2 : 1;

    while (attempt < maxAttempts) {
        attempt += 1;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
                signal,
            });

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

            const data = await response.json();

            if (useCache) {
                responseCache.set(url, {
                    data,
                    timestamp: Date.now(),
                });
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError('Отсутствует соединение с сетью или сервер недоступен', 0);
        }
    }
}
