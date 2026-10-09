import { books } from './data/books.js';
import { render } from './ui/render.js';

/**
 * Константы для ключей в localStorage
 */
const STORAGE_KEY_FILTERS = 'booknest_filters';
const STORAGE_KEY_WISHLIST = 'booknest_wishlist';

const DEFAULT_FILTERS = {
    query: '',
    genre: '',
    onlyAvailable: false,
};

const DEFAULT_SORT = 'title';

/**
 * Безопасное чтение из localStorage с защитой от поврежденных данных
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function loadFromStorage(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`[Storage] Ошибка чтения ключа «${key}»:`, error);
        return defaultValue;
    }
}

/**
 * Безопасная запись в localStorage
 * @param {string} key
 * @param {*} value
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[Storage] Ошибка записи ключа «${key}»:`, error);
    }
}

// Восстановление сохраненного состояния
const savedSettings = loadFromStorage(STORAGE_KEY_FILTERS, {
    filters: DEFAULT_FILTERS,
    sortBy: DEFAULT_SORT,
});
const savedWishlist = loadFromStorage(STORAGE_KEY_WISHLIST, []);

/**
 * Единый объект состояния приложения (Single Source of Truth)
 */
const state = {
    books,
    filters: {
        ...DEFAULT_FILTERS,
        ...(savedSettings.filters || {}),
    },
    sortBy: savedSettings.sortBy || DEFAULT_SORT,
    wishlist: Array.isArray(savedWishlist) ? savedWishlist : [],
    isWishlistOpen: false,
};

/**
 * Обновление состояния и последующий вызов render() (UI = f(state))
 * @param {Object} partialState - часть состояния, которую нужно обновить
 */
function updateState(partialState = {}) {
    Object.assign(state, partialState);

    // Синхронизируем с localStorage
    saveToStorage(STORAGE_KEY_FILTERS, {
        filters: state.filters,
        sortBy: state.sortBy,
    });
    saveToStorage(STORAGE_KEY_WISHLIST, state.wishlist);

    // Единый вызов перерисовки интерфейса
    render(state);
}

/**
 * Инициализация элементов DOM и обработчиков событий
 */
function initApp() {
    const filtersForm = document.getElementById('filters-form');
    const searchInput = document.getElementById('search-input');
    const genreSelect = document.getElementById('genre-select');
    const sortSelect = document.getElementById('sort-select');
    const availableCheckbox = document.getElementById('available-only');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const emptyResetBtn = document.getElementById('empty-reset-btn');

    const booksContainer = document.getElementById('books-list-container');
    const wishlistToggleBtn = document.getElementById('wishlist-toggle-btn');
    const wishlistCloseBtn = document.getElementById('wishlist-close-btn');
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistItemsList = document.getElementById('wishlist-items-list');

    // 1. Синхронизируем контролы формы с восстановленным из storage состоянием
    if (searchInput) searchInput.value = state.filters.query;
    if (genreSelect) genreSelect.value = state.filters.genre;
    if (sortSelect) sortSelect.value = state.sortBy;
    if (availableCheckbox) availableCheckbox.checked = state.filters.onlyAvailable;

    // 2. Единый обработчик изменений в форме фильтров (мгновенная реакция)
    function handleFiltersChange() {
        updateState({
            filters: {
                query: searchInput ? searchInput.value : '',
                genre: genreSelect ? genreSelect.value : '',
                onlyAvailable: availableCheckbox ? availableCheckbox.checked : false,
            },
            sortBy: sortSelect ? sortSelect.value : DEFAULT_SORT,
        });
    }

    if (filtersForm) {
        // Мгновенный поиск при вводе текста
        filtersForm.addEventListener('input', handleFiltersChange);
        // Реакция на изменение select и checkbox
        filtersForm.addEventListener('change', handleFiltersChange);
        // Предотвращение перезагрузки страницы при Submit
        filtersForm.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    // 3. Сброс фильтров в исходное состояние
    function resetFilters() {
        if (searchInput) searchInput.value = '';
        if (genreSelect) genreSelect.value = '';
        if (sortSelect) sortSelect.value = DEFAULT_SORT;
        if (availableCheckbox) availableCheckbox.checked = false;

        updateState({
            filters: { ...DEFAULT_FILTERS },
            sortBy: DEFAULT_SORT,
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    if (emptyResetBtn) {
        emptyResetBtn.addEventListener('click', resetFilters);
    }

    // 4. Делегирование событий: клики по кнопке «Хочу прочитать» на карточках
    if (booksContainer) {
        booksContainer.addEventListener('click', (event) => {
            const wishlistBtn = event.target.closest('[data-action="toggle-wishlist"]');
            if (!wishlistBtn) return;

            const bookId = Number(wishlistBtn.dataset.id);
            const isAlreadyAdded = state.wishlist.includes(bookId);

            const nextWishlist = isAlreadyAdded
                ? state.wishlist.filter((id) => id !== bookId)
                : [...state.wishlist, bookId];

            updateState({ wishlist: nextWishlist });
        });
    }

    // 5. Управление модальным окном «Мой список»
    if (wishlistToggleBtn) {
        wishlistToggleBtn.addEventListener('click', () => {
            updateState({ isWishlistOpen: true });
        });
    }

    if (wishlistCloseBtn) {
        wishlistCloseBtn.addEventListener('click', () => {
            updateState({ isWishlistOpen: false });
        });
    }

    if (wishlistModal) {
        // Синхронизация закрытия модалки по клавише Escape или клику вне окна
        wishlistModal.addEventListener('close', () => {
            if (state.isWishlistOpen) {
                updateState({ isWishlistOpen: false });
            }
        });
        wishlistModal.addEventListener('click', (event) => {
            if (event.target === wishlistModal) {
                updateState({ isWishlistOpen: false });
            }
        });
    }

    // 6. Делегирование событий: удаление книги из модального окна «Мой список»
    if (wishlistItemsList) {
        wishlistItemsList.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-action="remove-wishlist"]');
            if (!removeBtn) return;

            const bookId = Number(removeBtn.dataset.id);
            const nextWishlist = state.wishlist.filter((id) => id !== bookId);

            updateState({ wishlist: nextWishlist });
        });
    }

    // Первичная отрисовка интерфейса при загрузке страницы
    render(state);
}

// Запуск приложения после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
