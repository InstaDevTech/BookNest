import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timerId = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timerId);
    }, [value, delayMs]);

    return debounced;
}
