import { getBookDetails, getSimilarBooks } from './api/books.js';
import { getErrorMessage } from './ui/render.js';

const STORAGE_KEY_WISHLIST = 'booknest_wishlist_v4';
const DEFAULT_BOOK_ID = 'OL166894W';
const FALLBACK_COVER = 'images/bookcoverfake.webp';

let activeController = null;
let currentBook = null;

function loadWishlist() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_WISHLIST);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveWishlist(list) {
    try {
        localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(list));
    } catch (error) {
        console.warn('[Storage] Ошибка сохранения списка желаемого:', error);
    }
}

// Единая функция переключения состояния страницы деталей книги (loading, error, success)
function setBookUiState(uiState, error = null) {
    const loadingEl = document.getElementById('book-loading-state');
    const errorEl = document.getElementById('book-error-state');
    const successEl = document.getElementById('book-success-state');
    const similarSection = document.getElementById('similar-books-section');

    if (loadingEl) loadingEl.hidden = uiState !== 'loading';
    if (errorEl) errorEl.hidden = uiState !== 'error';
    if (successEl) successEl.hidden = uiState !== 'success';
    if (similarSection) similarSection.hidden = uiState === 'error';

    if (uiState === 'error') {
        const titleEl = document.getElementById('book-error-title');
        const textEl = document.getElementById('book-error-text');
        const breadcrumbTitle = document.getElementById('breadcrumb-book-title');
        const msg = getErrorMessage(error);

        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Ошибка загрузки';

        if (Number(error?.status) === 404) {
            if (titleEl) titleEl.textContent = 'Книга не найдена (Ошибка 404)';
            if (textEl) {
                textEl.textContent =
                    'Книга с указанным идентификатором не найдена в каталоге Open Library. Проверьте адрес ссылки или вернитесь в каталог.';
            }
        } else {
            if (titleEl) titleEl.textContent = msg.title;
            if (textEl) textEl.textContent = msg.text;
        }
    }
}

function syncWishlistButton(bookId) {
    const wishlistBtn = document.getElementById('book-wishlist-btn');
    if (!wishlistBtn) return;

    const wishlist = loadWishlist();
    const isAdded = wishlist.some((item) => String(item.id) === String(bookId));

    wishlistBtn.classList.toggle('btn-wishlist--active', isAdded);
    wishlistBtn.setAttribute('aria-pressed', isAdded ? 'true' : 'false');
    wishlistBtn.textContent = isAdded ? '✓ В желаемом' : '♡ Хочу прочитать';
}

function renderBookDetails(book) {
    document.title = `BookNest — ${book.title}`;

    const breadcrumbTitle = document.getElementById('breadcrumb-book-title');
    const coverImg = document.getElementById('book-detail-cover');
    const titleEl = document.getElementById('book-detail-title');
    const authorEl = document.getElementById('book-detail-author');
    const genreEl = document.getElementById('book-detail-genre');
    const yearEl = document.getElementById('book-detail-year');
    const langEl = document.getElementById('book-detail-lang');
    const pagesEl = document.getElementById('book-detail-pages');
    const isbnEl = document.getElementById('book-detail-isbn');
    const descEl = document.getElementById('book-detail-description');

    if (breadcrumbTitle) breadcrumbTitle.textContent = book.title;
    if (coverImg) {
        coverImg.src = book.cover || FALLBACK_COVER;
        coverImg.alt = `Обложка книги «${book.title}»`;
        coverImg.addEventListener(
            'error',
            () => {
                coverImg.src = FALLBACK_COVER;
            },
            { once: true }
        );
    }
    if (titleEl) titleEl.textContent = book.title;
    if (authorEl) authorEl.textContent = book.author;
    if (genreEl) genreEl.textContent = book.genreText;
    if (yearEl) yearEl.textContent = String(book.year);
    if (langEl) langEl.textContent = book.language;
    if (pagesEl) {
        const countInfo = book.ratingsCount ? ` (${book.ratingsCount} оценок)` : '';
        pagesEl.textContent = `${book.pages} стр. · ★ ${book.rating}${countInfo}`;
    }
    if (isbnEl) isbnEl.textContent = book.isbn;
    if (descEl) descEl.textContent = book.description;

    syncWishlistButton(book.id);
}

// Отрисовка карточек похожих книг (схожая тема/жанр и близкий год издания)
function renderSimilarBooks(similarBooks, baseBook) {
    const container = document.getElementById('similar-books-container');
    const subtitle = document.getElementById('similar-subtitle');
    if (!container) return;

    container.replaceChildren();

    if (!Array.isArray(similarBooks) || similarBooks.length === 0) {
        if (subtitle) {
            subtitle.textContent = 'Похожие издания по данной тематике не найдены.';
        }
        return;
    }

    const mainSubject =
        Array.isArray(baseBook?.subjects) && baseBook.subjects.length > 0
            ? baseBook.subjects[0]
            : 'выбранному жанру';

    if (subtitle) {
        subtitle.textContent = `Подобрано по теме «${mainSubject}» и близкому году публикации (${baseBook?.year || 'классика'}):`;
    }

    const fragment = document.createDocumentFragment();

    similarBooks.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'similar-card';

        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = item.cover || FALLBACK_COVER;
        img.alt = `Обложка книги «${item.title}»`;
        img.width = 180;
        img.height = 260;
        img.loading = 'lazy';
        img.addEventListener('error', () => {
            img.src = FALLBACK_COVER;
        });
        figure.appendChild(img);

        const h3 = document.createElement('h3');
        const link = document.createElement('a');
        link.href = `book.html?id=${encodeURIComponent(item.id)}`;
        link.textContent = item.title;
        h3.appendChild(link);

        const metaP = document.createElement('p');
        metaP.textContent = `${item.author} · ${item.year} г.`;

        card.appendChild(figure);
        card.appendChild(h3);
        card.appendChild(metaP);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

async function loadBookById(bookId) {
    if (activeController) {
        activeController.abort();
    }
    const controller = new AbortController();
    activeController = controller;

    setBookUiState('loading');

    let finalState = 'loading';
    let caughtError = null;
    let isAborted = false;

    try {
        const details = await getBookDetails(bookId, { signal: controller.signal });
        currentBook = details;
        renderBookDetails(details);
        finalState = 'success';

        // Подгружаем действительно похожие книги по теме и близкому году
        const similar = await getSimilarBooks(details, { limit: 4, signal: controller.signal }).catch(() => []);
        renderSimilarBooks(similar, details);
    } catch (error) {
        if (error.name === 'AbortError') {
            isAborted = true;
            return;
        }
        caughtError = error;
        finalState = 'error';
    } finally {
        if (!isAborted && activeController === controller) {
            activeController = null;
            setBookUiState(finalState, caughtError);
        }
    }
}

function initBookPage() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('id') || DEFAULT_BOOK_ID;

    const retryBtn = document.getElementById('book-retry-btn');
    const wishlistBtn = document.getElementById('book-wishlist-btn');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadBookById(bookId);
        });
    }

    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            if (!currentBook) return;
            const list = loadWishlist();
            const exists = list.some((item) => String(item.id) === String(currentBook.id));

            const nextList = exists
                ? list.filter((item) => String(item.id) !== String(currentBook.id))
                : [
                      ...list,
                      {
                          id: String(currentBook.id),
                          title: currentBook.title,
                          author: currentBook.author,
                      },
                  ];

            saveWishlist(nextList);
            syncWishlistButton(currentBook.id);
        });
    }

    loadBookById(bookId);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookPage);
} else {
    initBookPage();
}
