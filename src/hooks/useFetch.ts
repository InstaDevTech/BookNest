import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client.js';

export type FetchStatus = 'loading' | 'success' | 'error';

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

export interface UseFetchResult<T> {
    data: T | null;
    error: ApiError | Error | null;
    status: FetchStatus;
    reload: () => void;
}

type Settled<T> =
    | { fetcher: Fetcher<T>; reloadKey: number; data: T; error: null }
    | { fetcher: Fetcher<T>; reloadKey: number; data: null; error: ApiError | Error };

function isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === 'AbortError';
}

/**
 * Универсальный хук загрузки данных.
 * fetcher должен быть стабильным (useCallback): при его смене запрос перезапускается,
 * а предыдущий отменяется через AbortController в функции очистки эффекта.
 */
export function useFetch<T>(fetcher: Fetcher<T>): UseFetchResult<T> {
    const [reloadKey, setReloadKey] = useState(0);
    const [settled, setSettled] = useState<Settled<T> | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetcher(controller.signal).then(
            (data) => setSettled({ fetcher, reloadKey, data, error: null }),
            (err: unknown) => {
                if (isAbortError(err)) return;
                const error = err instanceof Error ? err : new ApiError('Ошибка сети', 0);
                setSettled({ fetcher, reloadKey, data: null, error });
            }
        );

        return () => controller.abort();
    }, [fetcher, reloadKey]);

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);

    // Статус выводится при рендере: результат относится к текущему запросу или нет
    const isCurrent = settled !== null && settled.fetcher === fetcher && settled.reloadKey === reloadKey;
    const status: FetchStatus = !isCurrent ? 'loading' : settled.error ? 'error' : 'success';

    return {
        data: settled?.data ?? null,
        error: isCurrent ? settled.error : null,
        status,
        reload,
    };
}
