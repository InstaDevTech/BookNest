import { getVisibleBooks } from '../lib/books.js';
import { GENRES } from '../data/books.js';

// Создание DOM-элемента карточки книги
export function createBookCard(book, isInWishlist) {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.dataset.id = String(book.id);

    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = book.cover || 'images/bookcoverfake.webp';
    img.alt = `Обложка книги «${book.title}»`;
    img.width = 150;
    img.height = 220;
    img.loading = 'lazy';
    img.addEventListener('error', () => {
        img.src = 'images/bookcoverfake.webp';
    });
    figure.appendChild(img);
    card.appendChild(figure);

    const h3 = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = `book.html?id=${encodeURIComponent(book.id)}`;
    titleLink.textContent = book.title;
    h3.appendChild(titleLink);
    card.appendChild(h3);

    const authorP = document.createElement('p');
    authorP.className = 'book-card-author';
    const birthNote = book.authorBirthDate ? ` (${book.authorBirthDate})` : '';
    authorP.textContent = `Автор: ${book.author}${birthNote}`;
    card.appendChild(authorP);

    const genreP = document.createElement('p');
    const genreName = GENRES[book.genre] || book.genre || 'Классика';
    genreP.textContent = `Жанр: ${genreName}`;
    card.appendChild(genreP);

    const metaP = document.createElement('p');
    const ratingVal = typeof book.rating === 'number' ? book.rating.toFixed(1) : '4.5';
    metaP.textContent = `Год: ${book.year} · Рейтинг: ★ ${ratingVal}`;
    card.appendChild(metaP);

    const statusP = document.createElement('p');
    statusP.className = `book-card-status ${
        book.available ? 'book-card-status--available' : 'book-card-status--unavailable'
    }`;
    statusP.textContent = book.available ? 'В наличии' : 'Нет в наличии';
    card.appendChild(statusP);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-card-actions';

    const wishlistBtn = document.createElement('button');
    wishlistBtn.type = 'button';
    wishlistBtn.className = `btn btn-wishlist ${isInWishlist ? 'btn-wishlist--active' : ''}`;
    wishlistBtn.dataset.action = 'toggle-wishlist';
    wishlistBtn.dataset.id = String(book.id);
    wishlistBtn.setAttribute('aria-pressed', isInWishlist ? 'true' : 'false');
    wishlistBtn.textContent = isInWishlist ? '✓ В желаемом' : '♡ Хочу прочитать';
    actionsDiv.appendChild(wishlistBtn);

    const detailsLink = document.createElement('a');
    detailsLink.href = `book.html?id=${encodeURIComponent(book.id)}`;
    detailsLink.className = 'btn btn-secondary';
    detailsLink.textContent = 'Подробнее о книге';
    actionsDiv.appendChild(detailsLink);

    card.appendChild(actionsDiv);

    return card;
}

// Создание элемента списка желаемого в модальном окне
export function createWishlistItem(book) {
    const li = document.createElement('li');
    li.className = 'wishlist-item';
    li.dataset.id = String(book.id);

    const titleLink = document.createElement('a');
    titleLink.href = `book.html?id=${encodeURIComponent(book.id)}`;
    titleLink.className = 'wishlist-item-title';
    titleLink.textContent = `${book.title} (${book.author})`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.dataset.action = 'remove-wishlist';
    removeBtn.dataset.id = String(book.id);
    removeBtn.setAttribute('aria-label', `Удалить «${book.title}» из списка`);
    removeBtn.textContent = 'Удалить';

    li.appendChild(titleLink);
    li.appendChild(removeBtn);
    return li;
}

// Формирование понятного текста ошибки в зависимости от типа сбоя (сеть, 4xx, 5xx)
export function getErrorMessage(error) {
    if (!error) {
        return {
            title: 'Неизвестная ошибка',
            text: 'Произошла непредвиденная ошибка при обращении к серверу.',
        };
    }

    const status = Number(error.status) || 0;

    if (status === 0 || !navigator.onLine) {
        return {
            title: 'Отсутствует подключение к сети',
            text: 'Не удалось связаться с сервером Open Library. Проверьте подключение к интернету (режим Offline) или корректность адреса API и нажмите «Повторить».',
        };
    }

    if (status === 404) {
        return {
            title: 'Данные не найдены (Ошибка 404)',
            text: 'Запрашиваемый ресурс или страница API не существует. Проверьте параметры запроса.',
        };
    }

    if (status >= 400 && status < 500) {
        return {
            title: `Ошибка запроса (Код ${status})`,
            text: 'Сервер отклонил запрос из-за некорректных параметров или ограничений доступа (4xx). Попробуйте изменить запрос.',
        };
    }

    if (status >= 500) {
        return {
            title: `Ошибка сервера Open Library (Код ${status})`,
            text: 'На стороне внешнего сервера произошел сбой (5xx). Мы уже попробовали повторить запрос автоматически — попробуйте ещё раз чуть позже.',
        };
    }

    return {
        title: 'Ошибка загрузки данных',
        text: error.message || 'Попробуйте повторить запрос.',
    };
}

// Единая функция переключения четырёх взаимоисключающих состояний (loading, error, empty, success)
export function applyCatalogUiState(uiState, error = null) {
    const loadingEl = document.getElementById('loading-state');
    const errorEl = document.getElementById('error-state');
    const emptyEl = document.getElementById('empty-state');
    const successEl = document.getElementById('success-state');

    if (loadingEl) loadingEl.hidden = uiState !== 'loading';
    if (errorEl) errorEl.hidden = uiState !== 'error';
    if (emptyEl) emptyEl.hidden = uiState !== 'empty';
    if (successEl) successEl.hidden = uiState !== 'success';

    if (uiState === 'error' && errorEl) {
        const titleEl = document.getElementById('error-state-title');
        const textEl = document.getElementById('error-state-text');
        const msg = getErrorMessage(error);
        if (titleEl) titleEl.textContent = msg.title;
        if (textEl) textEl.textContent = msg.text;
    }
}

// Главная функция отрисовки интерфейса (UI = f(state))
export function render(state) {
    const booksContainer = document.getElementById('books-list-container');
    const countElement = document.getElementById('results-count');
    const wishlistCounter = document.getElementById('wishlist-counter');
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistItemsList = document.getElementById('wishlist-items-list');
    const wishlistEmpty = document.getElementById('wishlist-empty-msg');

    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const pageIndicator = document.getElementById('page-indicator');

    // Локальная дофильтрация (например "Только доступные") и сортировка текущей выборки
    const visibleBooks = getVisibleBooks(
        state.books,
        { query: '', genre: '', onlyAvailable: state.filters.onlyAvailable },
        state.sortBy
    );

    // Определяем итоговое взаимоисключающее состояние интерфейса
    let effectiveUiState = state.uiState;
    if (state.uiState === 'success' && visibleBooks.length === 0) {
        effectiveUiState = 'empty';
    }

    applyCatalogUiState(effectiveUiState, state.error);

    // Обновляем счетчик найденных книг
    if (countElement) {
        if (effectiveUiState === 'loading') {
            countElement.textContent = 'Загрузка данных...';
        } else if (effectiveUiState === 'error') {
            countElement.textContent = 'Ошибка соединения';
        } else if (effectiveUiState === 'empty') {
            countElement.textContent = 'Найдено книг: 0';
        } else {
            countElement.textContent = `Показано: ${visibleBooks.length} (всего в API: ${state.totalFound})`;
        }
    }

    // Отрисовка карточек в состоянии success
    if (booksContainer && effectiveUiState === 'success') {
        booksContainer.replaceChildren();
        const wishlistIds = new Set(state.wishlist.map((item) => String(item.id)));
        const fragment = document.createDocumentFragment();

        visibleBooks.forEach((book) => {
            const card = createBookCard(book, wishlistIds.has(String(book.id)));
            fragment.appendChild(card);
        });

        booksContainer.appendChild(fragment);
    }

    // Управление пагинацией (блокировка кнопок на границах)
    if (pageIndicator) {
        pageIndicator.textContent = `Страница ${state.page} из ${state.totalPages}`;
    }
    if (prevPageBtn) {
        prevPageBtn.disabled = state.page <= 1 || state.uiState === 'loading';
    }
    if (nextPageBtn) {
        nextPageBtn.disabled = state.page >= state.totalPages || state.uiState === 'loading';
    }
    if (loadMoreBtn) {
        const hasMore = state.page < state.totalPages;
        loadMoreBtn.hidden = !hasMore;
        loadMoreBtn.disabled = !hasMore || state.isLoadingMore || state.uiState === 'loading';
        loadMoreBtn.textContent = state.isLoadingMore ? 'Загружаем ещё...' : 'Показать ещё 20 книг';
    }

    // Обновляем бейдж списка желаемого в шапке
    if (wishlistCounter) {
        wishlistCounter.textContent = String(state.wishlist.length);
    }

    // Обновляем содержимое модального окна «Мой список»
    if (wishlistItemsList && wishlistEmpty) {
        wishlistItemsList.replaceChildren();

        if (state.wishlist.length === 0) {
            wishlistEmpty.hidden = false;
        } else {
            wishlistEmpty.hidden = true;
            const fragment = document.createDocumentFragment();

            state.wishlist.forEach((book) => {
                fragment.appendChild(createWishlistItem(book));
            });

            wishlistItemsList.appendChild(fragment);
        }
    }

    // Открытие и закрытие модального окна «Мой список»
    if (wishlistModal) {
        if (state.isWishlistOpen && !wishlistModal.open) {
            wishlistModal.showModal();
        } else if (!state.isWishlistOpen && wishlistModal.open) {
            wishlistModal.close();
        }
    }
}
