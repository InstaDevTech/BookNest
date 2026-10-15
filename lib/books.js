/**
 * Чистые функции (Pure functions) для работы со списком книг.
 * Требования:
 * - Не обращаются к DOM (никаких document / window).
 * - Не мутируют входящие массивы и объекты (всегда возвращают новые копии).
 */

/**
 * Фильтрация книг по поисковой строке, жанру и доступности.
 * @param {Array<Object>} items - исходный массив книг
 * @param {Object} filters - критерии фильтрации
 * @param {string} [filters.query=''] - поисковая строка (по названию или автору)
 * @param {string} [filters.genre=''] - идентификатор жанра
 * @param {boolean} [filters.onlyAvailable=false] - флаг "только доступные"
 * @returns {Array<Object>} новый отфильтрованный массив
 */
export function filterBooks(items, { query = '', genre = '', onlyAvailable = false } = {}) {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((book) => {
        // 1. Поиск по названию или автору (регистронезависимый)
        if (normalizedQuery) {
            const titleMatches = book.title.toLowerCase().includes(normalizedQuery);
            const authorMatches = book.author.toLowerCase().includes(normalizedQuery);
            if (!titleMatches && !authorMatches) {
                return false;
            }
        }

        // 2. Фильтр по жанру
        if (genre && book.genre !== genre) {
            return false;
        }

        // 3. Фильтр "только доступные"
        if (onlyAvailable && !book.available) {
            return false;
        }

        return true;
    });
}

/**
 * Сортировка книг по выбранному критерию.
 * ВАЖНО: исходный массив не мутируется (используется копия [...items]).
 * @param {Array<Object>} items - массив книг
 * @param {string} [sortBy='title'] - критерий сортировки: 'title', 'year', 'rating'
 * @returns {Array<Object>} новый отсортированный массив
 */
export function sortBooks(items, sortBy = 'title') {
    const copy = [...items];

    switch (sortBy) {
        case 'title':
            // По названию: А–Я (с корректной поддержкой русского алфавита)
            return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

        case 'year':
            // По году: новые сначала (убывание года)
            return copy.sort((a, b) => b.year - a.year);

        case 'rating':
            // По рейтингу: от высокого к низкому (убывание рейтинга)
            return copy.sort((a, b) => b.rating - a.rating);

        default:
            return copy;
    }
}

/**
 * Комплексная обработка: фильтрация + сортировка
 * @param {Array<Object>} items - исходный массив книг
 * @param {Object} filters - фильтры (query, genre, onlyAvailable)
 * @param {string} sortBy - критерий сортировки
 * @returns {Array<Object>} готовый массив книг для отображения
 */
export function getVisibleBooks(items, filters, sortBy) {
    const filtered = filterBooks(items, filters);
    return sortBooks(filtered, sortBy);
}
