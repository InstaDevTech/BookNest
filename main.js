import { searchBooks, PAGE_LIMIT } from './api/books.js';
import { render } from './ui/render.js';

const STORAGE_KEY_FILTERS = 'booknest_filters_v4';
const STORAGE_KEY_WISHLIST = 'booknest_wishlist_v4';

const DEFAULT_FILTERS = {
    query: '',
    genre: '',
    onlyAvailable: false,
};

const DEFAULT_SORT = 'title';
const DEBOUNCE_DELAY_MS = 350;
const MIN_QUERY_LENGTH = 2;

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

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`[Storage] Ошибка записи ключа «${key}»:`, error);
    }
}

// Нормализация сохранённого списка желаемого (поддержка как объектов, так и старых ID)
function normalizeWishlist(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList
        .filter((item) => item !== null && item !== undefined)
        .map((item) => {
            if (typeof item === 'object' && item.id) {
                return {
                    id: String(item.id),
                    title: item.title || 'Книга из каталога',
                    author: item.author || 'Автор не указан',
                };
            }
            return {
                id: String(item),
                title: `Книга #${item}`,
                author: 'Open Library',
            };
        });
}

const savedSettings = loadFromStorage(STORAGE_KEY_FILTERS, {
    filters: DEFAULT_FILTERS,
    sortBy: DEFAULT_SORT,
});
const savedWishlist = normalizeWishlist(loadFromStorage(STORAGE_KEY_WISHLIST, []));

// Единый объект состояния приложения
const state = {
    books: [],
    uiState: 'loading', // 'loading' | 'success' | 'empty' | 'error'
    error: null,
    page: 1,
    totalPages: 1,
    totalFound: 0,
    isLoadingMore: false,
    filters: {
        ...DEFAULT_FILTERS,
        ...(savedSettings.filters || {}),
    },
    sortBy: savedSettings.sortBy || DEFAULT_SORT,
    wishlist: savedWishlist,
    isWishlistOpen: false,
};

let activeAbortController = null;
let debounceTimerId = null;

function updateState(partialState = {}) {
    Object.assign(state, partialState);

    saveToStorage(STORAGE_KEY_FILTERS, {
        filters: state.filters,
        sortBy: state.sortBy,
    });
    saveToStorage(STORAGE_KEY_WISHLIST, state.wishlist);

    render(state);
}

// Загрузка книг из Open Library API с отменой предыдущего запроса через AbortController
async function loadCatalogBooks({ page = 1, append = false } = {}) {
    if (activeAbortController) {
        activeAbortController.abort();
    }

    const controller = new AbortController();
    activeAbortController = controller;

    if (append) {
        updateState({ isLoadingMore: true, error: null });
    } else {
        updateState({ uiState: 'loading', error: null, page });
    }

    let nextUiState = state.uiState;
    let nextBooks = state.books;
    let nextTotalFound = state.totalFound;
    let nextTotalPages = state.totalPages;
    let nextError = null;
    let isAborted = false;

    try {
        const result = await searchBooks({
            query: state.filters.query,
            genre: state.filters.genre,
            sort: state.sortBy,
            page,
            limit: PAGE_LIMIT,
            signal: controller.signal,
        });

        nextTotalFound = result.totalFound;
        nextTotalPages = result.totalPages;

        if (append) {
            const existingIds = new Set(state.books.map((b) => String(b.id)));
            const freshBooks = result.books.filter((b) => !existingIds.has(String(b.id)));
            nextBooks = [...state.books, ...freshBooks];
        } else {
            nextBooks = result.books;
        }

        nextUiState = nextBooks.length > 0 ? 'success' : 'empty';
        state.page = page;
    } catch (error) {
        if (error.name === 'AbortError') {
            isAborted = true;
            return;
        }
        nextUiState = 'error';
        nextError = error;
    } finally {
        // Снятие индикатора загрузки строго в блоке finally (если запрос не был отменён новым)
        if (!isAborted && activeAbortController === controller) {
            activeAbortController = null;
            updateState({
                books: nextBooks,
                totalFound: nextTotalFound,
                totalPages: nextTotalPages,
                uiState: nextUiState,
                error: nextError,
                isLoadingMore: false,
            });
        }
    }
}

function initApp() {
    const filtersForm = document.getElementById('filters-form');
    const searchInput = document.getElementById('search-input');
    const searchHint = document.getElementById('search-hint');
    const genreSelect = document.getElementById('genre-select');
    const sortSelect = document.getElementById('sort-select');
    const availableCheckbox = document.getElementById('available-only');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const emptyResetBtn = document.getElementById('empty-reset-btn');
    const retryBtn = document.getElementById('retry-btn');

    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');

    const booksContainer = document.getElementById('books-list-container');
    const wishlistToggleBtn = document.getElementById('wishlist-toggle-btn');
    const wishlistCloseBtn = document.getElementById('wishlist-close-btn');
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistItemsList = document.getElementById('wishlist-items-list');

    if (searchInput) searchInput.value = state.filters.query;
    if (genreSelect) genreSelect.value = state.filters.genre;
    if (sortSelect) sortSelect.value = state.sortBy;
    if (availableCheckbox) availableCheckbox.checked = state.filters.onlyAvailable;

    // Обновление подсказки минимальной длины запроса
    function updateSearchHint(rawQuery) {
        if (!searchHint) return;
        const trimmed = rawQuery.trim();
        if (trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH) {
            searchHint.textContent = `Введите ещё хотя бы ${MIN_QUERY_LENGTH - trimmed.length} симв. для отправки запроса`;
            searchHint.classList.add('form-hint--warning');
        } else {
            searchHint.textContent = 'Введите минимум 2 символа для поиска по API';
            searchHint.classList.remove('form-hint--warning');
        }
    }

    // Поиск по API с debounce 350 мс и проверкой минимальной длины запроса
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const rawValue = searchInput.value;
            const trimmed = rawValue.trim();

            updateSearchHint(rawValue);
            clearTimeout(debounceTimerId);

            // Если введён всего 1 символ — не отправляем запрос к API, но отменяем текущий
            if (trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH) {
                if (activeAbortController) {
                    activeAbortController.abort();
                    activeAbortController = null;
                }
                return;
            }

            debounceTimerId = setTimeout(() => {
                state.filters.query = trimmed;
                loadCatalogBooks({ page: 1, append: false });
            }, DEBOUNCE_DELAY_MS);
        });
    }

    // Реакция на смену жанра или сортировки
    if (genreSelect) {
        genreSelect.addEventListener('change', () => {
            state.filters.genre = genreSelect.value;
            loadCatalogBooks({ page: 1, append: false });
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sortBy = sortSelect.value;
            loadCatalogBooks({ page: 1, append: false });
        });
    }

    // Локальный фильтр «Только доступные» поверх загруженных данных
    if (availableCheckbox) {
        availableCheckbox.addEventListener('change', () => {
            updateState({
                filters: {
                    ...state.filters,
                    onlyAvailable: availableCheckbox.checked,
                },
            });
        });
    }

    if (filtersForm) {
        filtersForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearTimeout(debounceTimerId);
            const trimmed = searchInput ? searchInput.value.trim() : '';
            if (trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH) {
                updateSearchHint(trimmed);
                return;
            }
            state.filters.query = trimmed;
            loadCatalogBooks({ page: 1, append: false });
        });
    }

    // Сброс фильтров
    function resetFilters() {
        clearTimeout(debounceTimerId);
        if (searchInput) searchInput.value = '';
        if (genreSelect) genreSelect.value = '';
        if (sortSelect) sortSelect.value = DEFAULT_SORT;
        if (availableCheckbox) availableCheckbox.checked = false;
        updateSearchHint('');

        state.filters = { ...DEFAULT_FILTERS };
        state.sortBy = DEFAULT_SORT;
        loadCatalogBooks({ page: 1, append: false });
    }

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

    // Кнопка «Повторить» в состоянии ошибки
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadCatalogBooks({ page: state.page, append: false });
        });
    }

    // Пагинация: кнопки «Назад», «Вперёд» и «Показать ещё»
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (state.page > 1) {
                loadCatalogBooks({ page: state.page - 1, append: false });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (state.page < state.totalPages) {
                loadCatalogBooks({ page: state.page + 1, append: false });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (state.page < state.totalPages && !state.isLoadingMore) {
                loadCatalogBooks({ page: state.page + 1, append: true });
            }
        });
    }

    // Добавление / удаление книги в список желаемого (сохраняется в localStorage вместе с названием и автором)
    if (booksContainer) {
        booksContainer.addEventListener('click', (event) => {
            const wishlistBtn = event.target.closest('[data-action="toggle-wishlist"]');
            if (!wishlistBtn) return;

            const bookId = String(wishlistBtn.dataset.id);
            const isAlreadyAdded = state.wishlist.some((item) => String(item.id) === bookId);

            let nextWishlist;
            if (isAlreadyAdded) {
                nextWishlist = state.wishlist.filter((item) => String(item.id) !== bookId);
            } else {
                const foundBook = state.books.find((b) => String(b.id) === bookId);
                const newItem = foundBook
                    ? { id: String(foundBook.id), title: foundBook.title, author: foundBook.author }
                    : { id: bookId, title: `Книга ${bookId}`, author: 'Open Library' };
                nextWishlist = [...state.wishlist, newItem];
            }

            updateState({ wishlist: nextWishlist });
        });
    }

    // Модальное окно «Мой список»
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

    if (wishlistItemsList) {
        wishlistItemsList.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-action="remove-wishlist"]');
            if (!removeBtn) return;

            const bookId = String(removeBtn.dataset.id);
            const nextWishlist = state.wishlist.filter((item) => String(item.id) !== bookId);
            updateState({ wishlist: nextWishlist });
        });
    }

    // Первичный запрос каталога из API при открытии страницы
    loadCatalogBooks({ page: 1, append: false });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
