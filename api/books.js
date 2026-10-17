import { apiRequest } from './client.js';

export const PAGE_LIMIT = 20;

const SEARCH_FIELDS = [
    'key',
    'title',
    'author_name',
    'author_key',
    'first_publish_year',
    'cover_i',
    'subject',
    'ratings_average',
    'number_of_pages_median',
    'isbn',
    'language',
    'ebook_access',
    'edition_count',
].join(',');

const GENRE_KEYWORDS = {
    classic: 'classic literature',
    'sci-fi': 'science fiction',
    romance: 'romance',
    satire: 'satire humor',
    detective: 'detective mystery',
};

const FALLBACK_COVERS = [
    'images/bookcoverfake.webp',
];

// Получение URL обложки Open Library или локальной заглушки
export function getCoverUrl(coverId, fallbackSeed = 0, size = 'M') {
    if (coverId && Number(coverId) > 0) {
        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }
    const index = Math.abs(Number(fallbackSeed) || 0) % FALLBACK_COVERS.length;
    return FALLBACK_COVERS[index];
}

// Определение категории жанра по списку тегов (subjects) из API
function detectGenre(subjects = [], activeGenre = '') {
    if (activeGenre) return activeGenre;
    if (!Array.isArray(subjects) || subjects.length === 0) return 'classic';

    const joined = subjects.slice(0, 25).join(' ').toLowerCase();
    if (joined.includes('science fiction') || joined.includes('sci-fi') || joined.includes('dystopia')) {
        return 'sci-fi';
    }
    if (joined.includes('detective') || joined.includes('mystery') || joined.includes('crime')) {
        return 'detective';
    }
    if (joined.includes('romance') || joined.includes('love')) {
        return 'romance';
    }
    if (joined.includes('satire') || joined.includes('humor')) {
        return 'satire';
    }
    return 'classic';
}

// Извлечение чистого идентификатора работы (например OL166894W из /works/OL166894W)
export function cleanWorkId(rawKey = '') {
    return String(rawKey).replace(/^\/works\//, '').trim();
}

// Нормализация документа из Search API в формат карточки книги приложения
export function mapSearchDocToBook(doc, index = 0, activeGenre = '') {
    const id = cleanWorkId(doc.key) || `book-${index}`;
    const author = Array.isArray(doc.author_name) && doc.author_name.length > 0
        ? doc.author_name.slice(0, 2).join(', ')
        : 'Неизвестный автор';
    const authorKey = Array.isArray(doc.author_key) && doc.author_key.length > 0
        ? doc.author_key[0]
        : null;

    const year = doc.first_publish_year || 'Н/Д';
    const rating = typeof doc.ratings_average === 'number'
        ? Number(doc.ratings_average.toFixed(1))
        : Number((4.0 + ((index % 9) * 0.1)).toFixed(1));

    const available = doc.ebook_access
        ? doc.ebook_access !== 'no_ebook'
        : (doc.edition_count || 1) > 1;

    return {
        id,
        title: doc.title || 'Без названия',
        author,
        authorKey,
        year,
        genre: detectGenre(doc.subject, activeGenre),
        rating,
        available,
        cover: getCoverUrl(doc.cover_i, index, 'M'),
        pages: doc.number_of_pages_median || null,
        isbn: Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null,
        language: Array.isArray(doc.language) && doc.language.length > 0 ? doc.language[0].toUpperCase() : 'RU / EN',
    };
}

// Поиск книг с пагинацией и обогащением данных через Promise.allSettled
export async function searchBooks({ query = '', genre = '', sort = '', page = 1, limit = PAGE_LIMIT, signal } = {}) {
    const trimmedQuery = query.trim();
    const genreKeyword = GENRE_KEYWORDS[genre] || '';

    let finalQuery = trimmedQuery;
    if (!finalQuery && genreKeyword) {
        finalQuery = genreKeyword;
    } else if (finalQuery && genreKeyword) {
        finalQuery = `${finalQuery} ${genreKeyword}`;
    } else if (!finalQuery) {
        finalQuery = 'classic literature';
    }

    const params = {
        q: finalQuery,
        page,
        limit,
        fields: SEARCH_FIELDS,
    };

    if (sort === 'year') {
        params.sort = 'new';
    } else if (sort === 'rating') {
        params.sort = 'rating';
    }

    const data = await apiRequest('/search.json', { params, signal });
    const docs = Array.isArray(data.docs) ? data.docs : [];
    const books = docs.map((doc, idx) => mapSearchDocToBook(doc, idx, genre));

    // Обогащение первых карточек параллельным запросом данных об авторах через Promise.allSettled
    const uniqueAuthorKeys = [...new Set(books.map((b) => b.authorKey).filter(Boolean))].slice(0, 3);
    if (uniqueAuthorKeys.length > 0) {
        const authorResults = await Promise.allSettled(
            uniqueAuthorKeys.map((authorKey) =>
                apiRequest(`/authors/${authorKey}.json`, { signal, retryOn5xx: false })
            )
        );

        const authorBioMap = new Map();
        authorResults.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value) {
                const key = uniqueAuthorKeys[idx];
                const birthDate = result.value.birth_date || null;
                if (birthDate) {
                    authorBioMap.set(key, birthDate);
                }
            }
        });

        books.forEach((book) => {
            if (book.authorKey && authorBioMap.has(book.authorKey)) {
                book.authorBirthDate = authorBioMap.get(book.authorKey);
            }
        });
    }

    const totalFound = Number(data.numFound) || 0;
    const totalPages = Math.max(1, Math.ceil(totalFound / limit));

    return {
        books,
        totalFound,
        page,
        totalPages,
    };
}

// Загрузка полных сведений о книге по ID (страница деталей) с использованием Promise.all и Promise.allSettled
export async function getBookDetails(workId, { signal } = {}) {
    const cleanId = cleanWorkId(workId);
    if (!cleanId) {
        throw new Error('Некорректный идентификатор книги');
    }

    // Независимые запросы к книге и её рейтингу выполняются параллельно через Promise.all
    const [workData, ratingsData] = await Promise.all([
        apiRequest(`/works/${cleanId}.json`, { signal }),
        apiRequest(`/works/${cleanId}/ratings.json`, { signal, retryOn5xx: false }).catch(() => null),
    ]);

    // Обогащение информации об авторах и изданиях через Promise.allSettled (устойчиво к частичному сбою)
    const authorRefs = Array.isArray(workData.authors) ? workData.authors.slice(0, 2) : [];
    const authorPromises = authorRefs.map((ref) => {
        const authorKey = ref?.author?.key || ref?.key;
        if (!authorKey) return Promise.resolve(null);
        return apiRequest(`${authorKey}.json`, { signal, retryOn5xx: false });
    });

    const editionsPromise = apiRequest(`/works/${cleanId}/editions.json`, {
        params: { limit: 1 },
        signal,
        retryOn5xx: false,
    });

    const settled = await Promise.allSettled([...authorPromises, editionsPromise]);
    const authorResults = settled.slice(0, authorPromises.length);
    const editionResult = settled[settled.length - 1];

    const authorNames = authorResults
        .filter((res) => res.status === 'fulfilled' && res.value?.name)
        .map((res) => res.value.name);

    const firstEdition =
        editionResult?.status === 'fulfilled' && Array.isArray(editionResult.value?.entries)
            ? editionResult.value.entries[0]
            : null;

    let description = 'Аннотация к данному изданию отсутствует в базе Open Library.';
    if (typeof workData.description === 'string') {
        description = workData.description;
    } else if (workData.description && typeof workData.description.value === 'string') {
        description = workData.description.value;
    }

    const coverId = Array.isArray(workData.covers) && workData.covers.length > 0
        ? workData.covers.find((id) => id > 0)
        : null;

    const subjects = Array.isArray(workData.subjects) ? workData.subjects.slice(0, 5) : [];
    const averageRating = ratingsData?.summary?.average
        ? Number(ratingsData.summary.average.toFixed(1))
        : 4.7;
    const ratingsCount = ratingsData?.summary?.count || 0;

    const publishYear =
        workData.first_publish_date ||
        firstEdition?.publish_date ||
        'Классическое издание';

    const pages = firstEdition?.number_of_pages || '320+';
    const isbn =
        (Array.isArray(firstEdition?.isbn_13) && firstEdition.isbn_13[0]) ||
        (Array.isArray(firstEdition?.isbn_10) && firstEdition.isbn_10[0]) ||
        `OL-${cleanId}`;

    return {
        id: cleanId,
        title: workData.title || 'Без названия',
        author: authorNames.length > 0 ? authorNames.join(', ') : 'Автор Open Library',
        genreText: subjects.length > 0 ? subjects.join(', ') : 'Художественная литература',
        year: publishYear,
        language: 'Многоязычное издание (Open Library)',
        pages: String(pages),
        isbn,
        available: true,
        cover: getCoverUrl(coverId, 0, 'L'),
        description,
        rating: averageRating,
        ratingsCount,
        subjects,
    };
}

// Поиск действительно похожих книг по тому же жанру/теме и близкому году издания
export async function getSimilarBooks(book, { limit = 4, signal } = {}) {
    if (!book) return [];

    const primarySubject =
        Array.isArray(book.subjects) && book.subjects.length > 0
            ? book.subjects.find((s) => s.length > 3 && !s.toLowerCase().includes('translation')) || book.subjects[0]
            : '';

    const primaryAuthor = book.author && book.author !== 'Автор Open Library'
        ? book.author.split(',')[0].trim()
        : '';

    const searchQuery = primarySubject || primaryAuthor || 'classic literature';

    const data = await apiRequest('/search.json', {
        params: {
            q: searchQuery,
            limit: 16,
            fields: SEARCH_FIELDS,
        },
        signal,
        retryOn5xx: false,
    });

    const docs = Array.isArray(data.docs) ? data.docs : [];
    const currentId = cleanWorkId(book.id);
    const targetYearMatch = String(book.year || '').match(/\d{4}/);
    const targetYear = targetYearMatch ? Number(targetYearMatch[0]) : null;

    const candidates = docs
        .map((doc, idx) => mapSearchDocToBook(doc, idx))
        .filter((item) => item.id && item.id !== currentId && item.title !== book.title);

    // Сортируем кандидатов по близости года публикации и наличию обложки
    candidates.sort((a, b) => {
        const aHasCover = !a.cover.includes('bookcoverfake') ? 1 : 0;
        const bHasCover = !b.cover.includes('bookcoverfake') ? 1 : 0;

        if (targetYear) {
            const aYear = typeof a.year === 'number' ? a.year : 9999;
            const bYear = typeof b.year === 'number' ? b.year : 9999;
            const diffA = Math.abs(aYear - targetYear) - aHasCover * 15;
            const diffB = Math.abs(bYear - targetYear) - bHasCover * 15;
            return diffA - diffB;
        }

        return bHasCover - aHasCover;
    });

    return candidates.slice(0, limit);
}

