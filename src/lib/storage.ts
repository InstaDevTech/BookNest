import type { CatalogFilters, SortOption, ThemeMode, WishlistItem } from '../types.js';

const STORAGE_KEY_FILTERS = 'booknest_filters_v5';
const STORAGE_KEY_WISHLIST = 'booknest_wishlist_v4';
const STORAGE_KEY_THEME = 'booknest_theme_v5';

export const DEFAULT_FILTERS: CatalogFilters = {
    query: '',
    genre: '',
    onlyAvailable: false,
};

export const DEFAULT_SORT: SortOption = 'title';

export function loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw) as T;
    } catch {
        return defaultValue;
    }
}

export function saveToStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Игнорируем ошибку переполнения квоты localStorage
    }
}

export function loadInitialSettings(): { filters: CatalogFilters; sortBy: SortOption } {
    const saved = loadFromStorage<{ filters?: Partial<CatalogFilters>; sortBy?: SortOption }>(
        STORAGE_KEY_FILTERS,
        {}
    );
    return {
        filters: {
            query: typeof saved.filters?.query === 'string' ? saved.filters.query : '',
            genre: saved.filters?.genre ?? '',
            onlyAvailable: Boolean(saved.filters?.onlyAvailable),
        },
        sortBy: saved.sortBy ?? DEFAULT_SORT,
    };
}

export function saveSettings(filters: CatalogFilters, sortBy: SortOption): void {
    saveToStorage(STORAGE_KEY_FILTERS, { filters, sortBy });
}

export function loadInitialWishlist(): WishlistItem[] {
    const raw = loadFromStorage<unknown[]>(STORAGE_KEY_WISHLIST, []);
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((item): item is Record<string, unknown> | string | number => item !== null && item !== undefined)
        .map((item) => {
            if (typeof item === 'object' && 'id' in item && item.id) {
                return {
                    id: String(item.id),
                    title: typeof item.title === 'string' ? item.title : 'Книга из каталога',
                    author: typeof item.author === 'string' ? item.author : 'Автор не указан',
                };
            }
            return {
                id: String(item),
                title: `Книга #${String(item)}`,
                author: 'Open Library',
            };
        });
}

export function saveWishlist(items: readonly WishlistItem[]): void {
    saveToStorage(STORAGE_KEY_WISHLIST, items);
}

export function loadInitialTheme(): ThemeMode {
    const saved = loadFromStorage<string>(STORAGE_KEY_THEME, '');
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: ThemeMode): void {
    saveToStorage(STORAGE_KEY_THEME, theme);
}
