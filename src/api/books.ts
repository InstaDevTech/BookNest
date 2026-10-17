import { apiRequest } from './client.js';
import type {
    Book,
    BookDetails,
    GenreFilter,
    GenreKey,
    SearchBooksResult,
    SortOption,
} from '../types.js';

export const PAGE_LIMIT = 20;
export const FALLBACK_COVER = 'images/bookcoverfake.webp';

interface OpenLibrarySearchDoc {
    key?: string;
    title?: string;
    author_name?: string[];
    author_key?: string[];
    first_publish_year?: number;
    cover_i?: number;
    subject?: string[];
    ratings_average?: number;
    number_of_pages_median?: number;
    isbn?: string[];
    language?: string[];
    ebook_access?: string;
    edition_count?: number;
}

interface OpenLibrarySearchResponse {
    numFound?: number;
    docs?: OpenLibrarySearchDoc[];
}

interface OpenLibraryAuthorRef {
    author?: { key?: string };
    key?: string;
}

interface OpenLibraryWorkResponse {
    title?: string;
    description?: string | { value?: string };
    covers?: number[];
    subjects?: string[];
    first_publish_date?: string;
    authors?: OpenLibraryAuthorRef[];
}

interface OpenLibraryRatingsResponse {
    summary?: {
        average?: number;
        count?: number;
    };
}

interface OpenLibraryAuthorResponse {
    name?: string;
    birth_date?: string;
}

interface OpenLibraryEditionsResponse {
    entries?: Array<{
        publish_date?: string;
        number_of_pages?: number;
        isbn_13?: string[];
        isbn_10?: string[];
    }>;
}

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

const GENRE_KEYWORDS: Record<GenreKey, string> = {
    classic: 'classic literature',
    'sci-fi': 'science fiction',
    romance: 'romance',
    satire: 'satire humor',
    detective: 'detective mystery',
};

export function getCoverUrl(coverId: number | undefined | null, size: 'M' | 'L' = 'M'): string {
    if (coverId && coverId > 0) {
        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }
    return FALLBACK_COVER;
}

function detectGenre(subjects: string[] | undefined, activeGenre: GenreFilter): GenreKey {
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

export function cleanWorkId(rawKey = ''): string {
    return rawKey.replace(/^\/works\//, '').trim();
}

export function mapSearchDocToBook(
    doc: OpenLibrarySearchDoc,
    index = 0,
    activeGenre: GenreFilter = ''
): Book {
    const id = cleanWorkId(doc.key ?? '') || `book-${index}`;
    const author =
        Array.isArray(doc.author_name) && doc.author_name.length > 0
            ? doc.author_name.slice(0, 2).join(', ')
            : 'Неизвестный автор';
    const authorKey =
        Array.isArray(doc.author_key) && doc.author_key.length > 0
            ? (doc.author_key[0] ?? null)
            : null;

    const year = doc.first_publish_year ?? 'Н/Д';
    const rating =
        typeof doc.ratings_average === 'number'
            ? Number(doc.ratings_average.toFixed(1))
            : Number((4.0 + (index % 9) * 0.1).toFixed(1));

    const available = doc.ebook_access
        ? doc.ebook_access !== 'no_ebook'
        : (doc.edition_count ?? 1) > 1;

    const firstIsbn = Array.isArray(doc.isbn) && doc.isbn.length > 0 ? (doc.isbn[0] ?? null) : null;
    const firstLang =
        Array.isArray(doc.language) && doc.language.length > 0 && doc.language[0]
            ? doc.language[0].toUpperCase()
            : 'RU / EN';

    return {
        id,
        title: doc.title ?? 'Без названия',
        author,
        authorKey,
        year,
        genre: detectGenre(doc.subject, activeGenre),
        rating,
        available,
        cover: getCoverUrl(doc.cover_i, 'M'),
        pages: doc.number_of_pages_median ?? null,
        isbn: firstIsbn,
        language: firstLang,
    };
}

export interface SearchBooksParams {
    query?: string;
    genre?: GenreFilter;
    sort?: SortOption;
    page?: number;
    limit?: number;
    signal?: AbortSignal | undefined;
}

export async function searchBooks(options: SearchBooksParams = {}): Promise<SearchBooksResult> {
    const {
        query = '',
        genre = '',
        sort = 'title',
        page = 1,
        limit = PAGE_LIMIT,
        signal,
    } = options;

    const trimmedQuery = query.trim();
    const genreKeyword = genre ? GENRE_KEYWORDS[genre] : '';

    let finalQuery = trimmedQuery;
    if (!finalQuery && genreKeyword) {
        finalQuery = genreKeyword;
    } else if (finalQuery && genreKeyword) {
        finalQuery = `${finalQuery} ${genreKeyword}`;
    } else if (!finalQuery) {
        finalQuery = 'classic literature';
    }

    const params: Record<string, string | number | undefined> = {
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

    const data = await apiRequest<OpenLibrarySearchResponse>('/search.json', { params, signal });
    const docs = Array.isArray(data.docs) ? data.docs : [];
    const books = docs.map((doc, idx) => mapSearchDocToBook(doc, idx, genre));

    const uniqueAuthorKeys = [
        ...new Set(books.map((b) => b.authorKey).filter((k): k is string => Boolean(k))),
    ].slice(0, 3);

    if (uniqueAuthorKeys.length > 0) {
        const authorResults = await Promise.allSettled(
            uniqueAuthorKeys.map((authorKey) =>
                apiRequest<OpenLibraryAuthorResponse>(`/authors/${authorKey}.json`, {
                    signal,
                    retryOn5xx: false,
                })
            )
        );

        const authorBioMap = new Map<string, string>();
        authorResults.forEach((result, idx) => {
            const key = uniqueAuthorKeys[idx];
            if (result.status === 'fulfilled' && result.value.birth_date && key) {
                authorBioMap.set(key, result.value.birth_date);
            }
        });

        books.forEach((book) => {
            if (book.authorKey) {
                const birthDate = authorBioMap.get(book.authorKey);
                if (birthDate) {
                    book.authorBirthDate = birthDate;
                }
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

export async function getBookDetails(
    workId: string,
    options: { signal?: AbortSignal | undefined } = {}
): Promise<BookDetails> {
    const cleanId = cleanWorkId(workId);
    if (!cleanId) {
        throw new Error('Некорректный идентификатор книги');
    }

    const [workData, ratingsData] = await Promise.all([
        apiRequest<OpenLibraryWorkResponse>(`/works/${cleanId}.json`, { signal: options.signal }),
        apiRequest<OpenLibraryRatingsResponse>(`/works/${cleanId}/ratings.json`, {
            signal: options.signal,
            retryOn5xx: false,
        }).catch(() => null),
    ]);

    const authorRefs = Array.isArray(workData.authors) ? workData.authors.slice(0, 2) : [];
    const authorPromises = authorRefs.map((ref) => {
        const authorKey = ref.author?.key ?? ref.key;
        if (!authorKey) return Promise.resolve(null);
        return apiRequest<OpenLibraryAuthorResponse>(`${authorKey}.json`, {
            signal: options.signal,
            retryOn5xx: false,
        });
    });

    const editionsPromise = apiRequest<OpenLibraryEditionsResponse>(
        `/works/${cleanId}/editions.json`,
        {
            params: { limit: 1 },
            signal: options.signal,
            retryOn5xx: false,
        }
    );

    const settled = await Promise.allSettled([...authorPromises, editionsPromise]);
    const authorResults = settled.slice(0, authorPromises.length);
    const editionResult = settled[settled.length - 1];

    const authorNames: string[] = [];
    authorResults.forEach((res) => {
        if (res.status === 'fulfilled' && res.value && 'name' in res.value && res.value.name) {
            authorNames.push(res.value.name);
        }
    });

    const firstEdition =
        editionResult &&
        editionResult.status === 'fulfilled' &&
        editionResult.value &&
        'entries' in editionResult.value &&
        Array.isArray(editionResult.value.entries)
            ? editionResult.value.entries[0]
            : undefined;

    let description = 'Аннотация к данному изданию отсутствует в базе Open Library.';
    if (typeof workData.description === 'string') {
        description = workData.description;
    } else if (workData.description && typeof workData.description.value === 'string') {
        description = workData.description.value;
    }

    const coverId = Array.isArray(workData.covers)
        ? workData.covers.find((id) => id > 0)
        : undefined;

    const subjects = Array.isArray(workData.subjects) ? workData.subjects.slice(0, 5) : [];
    const averageRating = ratingsData?.summary?.average
        ? Number(ratingsData.summary.average.toFixed(1))
        : 4.7;
    const ratingsCount = ratingsData?.summary?.count ?? 0;

    const publishYear =
        workData.first_publish_date ?? firstEdition?.publish_date ?? 'Классическое издание';

    const pages = firstEdition?.number_of_pages ?? '320+';
    const isbn =
        firstEdition?.isbn_13?.[0] ?? firstEdition?.isbn_10?.[0] ?? `OL-${cleanId}`;

    return {
        id: cleanId,
        title: workData.title ?? 'Без названия',
        author: authorNames.length > 0 ? authorNames.join(', ') : 'Автор Open Library',
        genreText: subjects.length > 0 ? subjects.join(', ') : 'Художественная литература',
        year: publishYear,
        language: 'Многоязычное издание (Open Library)',
        pages: String(pages),
        isbn,
        available: true,
        cover: getCoverUrl(coverId, 'L'),
        description,
        rating: averageRating,
        ratingsCount,
        subjects,
    };
}

export async function getSimilarBooks(
    book: BookDetails,
    options: { limit?: number; signal?: AbortSignal | undefined } = {}
): Promise<Book[]> {
    const { limit = 4, signal } = options;
    const primarySubject =
        book.subjects.find((s) => s.length > 3 && !s.toLowerCase().includes('translation')) ??
        book.subjects[0] ??
        '';

    const primaryAuthor =
        book.author && book.author !== 'Автор Open Library'
            ? (book.author.split(',')[0]?.trim() ?? '')
            : '';

    const searchQuery = primarySubject || primaryAuthor || 'classic literature';

    const data = await apiRequest<OpenLibrarySearchResponse>('/search.json', {
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
    const targetYearMatch = String(book.year).match(/\d{4}/);
    const targetYear = targetYearMatch?.[0] ? Number(targetYearMatch[0]) : null;

    const candidates = docs
        .map((doc, idx) => mapSearchDocToBook(doc, idx))
        .filter((item) => item.id && item.id !== currentId && item.title !== book.title);

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
