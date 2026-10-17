import type { Book, CatalogFilters, GenreKey, SortOption } from '../types.js';

export const GENRES: Record<GenreKey, string> = {
    classic: 'Классика',
    'sci-fi': 'Научная Фантастика',
    romance: 'Роман',
    satire: 'Сатира',
    detective: 'Детектив',
};

// Фильтрация книг по поисковой строке, жанру и доступности (чистая функция без мутаций)
export function filterBooks(items: readonly Book[], filters: CatalogFilters): Book[] {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return items.filter((book) => {
        if (normalizedQuery) {
            const titleMatches = book.title.toLowerCase().includes(normalizedQuery);
            const authorMatches = book.author.toLowerCase().includes(normalizedQuery);
            if (!titleMatches && !authorMatches) {
                return false;
            }
        }

        if (filters.genre && book.genre !== filters.genre) {
            return false;
        }

        if (filters.onlyAvailable && !book.available) {
            return false;
        }

        return true;
    });
}

// Сортировка книг по выбранному критерию без мутации исходного массива
export function sortBooks(items: readonly Book[], sortBy: SortOption = 'title'): Book[] {
    const copy = [...items];

    switch (sortBy) {
        case 'title':
            return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

        case 'year':
            return copy.sort((a, b) => {
                const yearA = typeof a.year === 'number' ? a.year : 0;
                const yearB = typeof b.year === 'number' ? b.year : 0;
                return yearB - yearA;
            });

        case 'rating':
            return copy.sort((a, b) => b.rating - a.rating);

        default:
            return copy;
    }
}

// Комплексная фильтрация и сортировка книг (вычисляется при рендере)
export function getVisibleBooks(
    items: readonly Book[],
    filters: CatalogFilters,
    sortBy: SortOption
): Book[] {
    const filtered = filterBooks(items, filters);
    return sortBooks(filtered, sortBy);
}
