import { getVisibleBooks } from '../lib/books.js';
import { GENRES } from '../data/books.js';

/**
 * Создание DOM-элемента карточки книги.
 * Безопасно: весь пользовательский/динамический текст устанавливается через textContent.
 *
 * @param {Object} book - объект книги
 * @param {boolean} isInWishlist - находится ли книга в списке желаемого
 * @returns {HTMLElement} карточка книги <article class="book-card">
 */
export function createBookCard(book, isInWishlist) {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.dataset.id = String(book.id);

    // 1. Обложка
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = book.cover || 'images/book1.webp';
    img.alt = `Обложка книги «${book.title}»`;
    img.width = 150;
    img.height = 220;
    img.loading = 'lazy';
    figure.appendChild(img);
    card.appendChild(figure);

    // 2. Название
    const h3 = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = 'book.html';
    titleLink.textContent = book.title; // Безопасно через textContent
    h3.appendChild(titleLink);
    card.appendChild(h3);

    // 3. Автор
    const authorP = document.createElement('p');
    authorP.className = 'book-card-author';
    authorP.textContent = `Автор: ${book.author}`; // textContent
    card.appendChild(authorP);

    // 4. Жанр и Рейтинг
    const genreP = document.createElement('p');
    const genreName = GENRES[book.genre] || book.genre;
    genreP.textContent = `Жанр: ${genreName}`;
    card.appendChild(genreP);

    const metaP = document.createElement('p');
    metaP.textContent = `Год: ${book.year} · Рейтинг: ★ ${book.rating.toFixed(1)}`;
    card.appendChild(metaP);

    // 5. Статус наличия
    const statusP = document.createElement('p');
    statusP.className = `book-card-status ${
        book.available ? 'book-card-status--available' : 'book-card-status--unavailable'
    }`;
    statusP.textContent = book.available ? 'В наличии' : 'Нет в наличии';
    card.appendChild(statusP);

    // 6. Блок действий (кнопка списка желаемого + кнопка взять)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-card-actions';

    // Кнопка "Хочу прочитать" с обязательным атрибутом aria-pressed
    const wishlistBtn = document.createElement('button');
    wishlistBtn.type = 'button';
    wishlistBtn.className = `btn btn-wishlist ${isInWishlist ? 'btn-wishlist--active' : ''}`;
    wishlistBtn.dataset.action = 'toggle-wishlist';
    wishlistBtn.dataset.id = String(book.id);
    wishlistBtn.setAttribute('aria-pressed', isInWishlist ? 'true' : 'false');
    wishlistBtn.textContent = isInWishlist ? '✓ В желаемом' : '♡ Хочу прочитать';
    actionsDiv.appendChild(wishlistBtn);

    // Ссылка "Взять книгу"
    const loanLink = document.createElement('a');
    loanLink.href = 'loan.html';
    loanLink.className = 'btn btn-secondary';
    loanLink.textContent = 'Взять книгу';
    actionsDiv.appendChild(loanLink);

    card.appendChild(actionsDiv);

    return card;
}

/**
 * Создание элемента для элемента списка в модальном окне «Мой список»
 * @param {Object} book
 * @returns {HTMLElement}
 */
export function createWishlistItem(book) {
    const li = document.createElement('li');
    li.className = 'wishlist-item';
    li.dataset.id = String(book.id);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'wishlist-item-title';
    titleSpan.textContent = `${book.title} (${book.author})`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.dataset.action = 'remove-wishlist';
    removeBtn.dataset.id = String(book.id);
    removeBtn.setAttribute('aria-label', `Удалить «${book.title}» из списка`);
    removeBtn.textContent = 'Удалить';

    li.appendChild(titleSpan);
    li.appendChild(removeBtn);
    return li;
}

/**
 * Главная функция отрисовки интерфейса (UI = f(state)).
 * Синхронизирует DOM в соответствии с текущим состоянием.
 *
 * @param {Object} state - единый объект состояния приложения
 */
export function render(state) {
    const booksContainer = document.getElementById('books-list-container');
    const countElement = document.getElementById('results-count');
    const emptyStateElement = document.getElementById('empty-state');
    const wishlistCounter = document.getElementById('wishlist-counter');
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistItemsList = document.getElementById('wishlist-items-list');
    const wishlistEmpty = document.getElementById('wishlist-empty-msg');

    // 1. Получаем отфильтрованные и отсортированные книги через чистую функцию
    const visibleBooks = getVisibleBooks(state.books, state.filters, state.sortBy);

    // 2. Обновляем счетчик найденных записей
    if (countElement) {
        countElement.textContent = `Найдено книг: ${visibleBooks.length}`;
    }

    // 3. Отображение списка книг / пустого состояния
    if (booksContainer) {
        booksContainer.replaceChildren(); // Очищаем контейнер

        if (visibleBooks.length === 0) {
            if (emptyStateElement) emptyStateElement.hidden = false;
        } else {
            if (emptyStateElement) emptyStateElement.hidden = true;
            const wishlistSet = new Set(state.wishlist);
            const fragment = document.createDocumentFragment();

            visibleBooks.forEach((book) => {
                const card = createBookCard(book, wishlistSet.has(book.id));
                fragment.appendChild(card);
            });

            booksContainer.appendChild(fragment);
        }
    }

    // 4. Обновляем бейдж счетчика в шапке
    if (wishlistCounter) {
        wishlistCounter.textContent = String(state.wishlist.length);
    }

    // 5. Обновляем содержимое модального окна «Мой список»
    if (wishlistItemsList && wishlistEmpty) {
        wishlistItemsList.replaceChildren();

        if (state.wishlist.length === 0) {
            wishlistEmpty.hidden = false;
        } else {
            wishlistEmpty.hidden = true;
            const wishlistBooks = state.books.filter((b) => state.wishlist.includes(b.id));
            const fragment = document.createDocumentFragment();

            wishlistBooks.forEach((book) => {
                fragment.appendChild(createWishlistItem(book));
            });

            wishlistItemsList.appendChild(fragment);
        }
    }

    // 6. Управление открытием/закрытием модального окна «Мой список»
    if (wishlistModal) {
        if (state.isWishlistOpen && !wishlistModal.open) {
            wishlistModal.showModal();
        } else if (!state.isWishlistOpen && wishlistModal.open) {
            wishlistModal.close();
        }
    }
}
