import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { WishlistItem } from '../../api/types.js';
import { loadInitialWishlist, saveWishlist } from '../../shared/lib/storage.js';

// Небольшое внешнее хранилище: список желаемого нужен и в шапке, и на страницах,
// но по требованиям Context используется только для темы и пользователя
let items: readonly WishlistItem[] = loadInitialWishlist();
const listeners = new Set<() => void>();

function update(next: readonly WishlistItem[]): void {
    items = next;
    saveWishlist(items);
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): readonly WishlistItem[] {
    return items;
}

export function useWishlist() {
    const list = useSyncExternalStore(subscribe, getSnapshot);
    const ids = useMemo(() => new Set(list.map((item) => item.id)), [list]);

    const toggle = useCallback((item: WishlistItem) => {
        update(
            items.some((w) => w.id === item.id)
                ? items.filter((w) => w.id !== item.id)
                : [...items, { id: item.id, title: item.title, author: item.author }]
        );
    }, []);

    const remove = useCallback((id: string) => {
        update(items.filter((w) => w.id !== id));
    }, []);

    return { items: list, ids, toggle, remove };
}
