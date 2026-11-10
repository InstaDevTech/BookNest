import { useEffect, useState, type SyntheticEvent } from 'react';
import { FALLBACK_COVER, getBookDetails, getSimilarBooks } from '../api/books.js';
import { ApiError } from '../api/client.js';
import type { Book, BookDetails, UiState } from '../types.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';
import { ErrorBox } from './ErrorBox.js';
import { Spinner } from './Spinner.js';

export interface BookDetailsViewProps {
    bookId: string;
    isInWishlist: boolean;
    onToggleWishlist: (item: { id: string; title: string; author: string }) => void;
    onSelectBook: (bookId: string) => void;
    onBackToCatalog: () => void;
}

export function BookDetailsView({
    bookId,
    isInWishlist,
    onToggleWishlist,
    onSelectBook,
    onBackToCatalog,
}: BookDetailsViewProps) {
    const [uiState, setUiState] = useState<UiState>('loading');
    const [book, setBook] = useState<BookDetails | null>(null);
    const [similar, setSimilar] = useState<Book[]>([]);
    const [error, setError] = useState<ApiError | Error | null>(null);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let isAborted = false;

        async function fetchDetails() {
            setUiState('loading');
            setError(null);
            let nextState: UiState = 'loading';
            let caughtErr: ApiError | Error | null = null;

            try {
                const details = await getBookDetails(bookId, { signal: controller.signal });
                setBook(details);
                nextState = 'success';
                const related = await getSimilarBooks(details, { limit: 4, signal: controller.signal }).catch(() => []);
                setSimilar(related);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    isAborted = true;
                    return;
                }
                caughtErr = err instanceof Error ? err : new ApiError('Ошибка загрузки', 0);
                nextState = 'error';
            } finally {
                if (!isAborted) {
                    setError(caughtErr);
                    setUiState(nextState);
                }
            }
        }

        void fetchDetails();
        return () => controller.abort();
    }, [bookId, reloadTrigger]);

    const handleCoverError = (event: SyntheticEvent<HTMLImageElement>) => {
        const target = event.currentTarget;
        if (!target.src.endsWith(FALLBACK_COVER)) target.src = FALLBACK_COVER;
    };

    return (
        <div>
            <nav aria-label="Хлебные крошки" className="breadcrumbs">
                <ol>
                    <li><a href="#catalog" onClick={(e) => { e.preventDefault(); onBackToCatalog(); }}>Каталог</a></li>
                    <li aria-current="page">{uiState === 'success' && book ? book.title : 'Карточка книги'}</li>
                </ol>
            </nav>

            {uiState === 'loading' && <Spinner title="Загружаем карточку книги из Open Library..." />}
            {uiState === 'error' && (
                <ErrorBox error={error} onRetry={() => setReloadTrigger((n) => n + 1)} secondaryActionLabel="Вернуться в каталог" onSecondaryAction={onBackToCatalog} />
            )}

            {uiState === 'success' && book && (
                <>
                    <article itemScope itemType="https://schema.org/Book">
                        <div className="book-details-layout">
                            <div className="book-cover-card">
                                <figure><img src={book.cover || FALLBACK_COVER} alt={book.title} width={260} height={380} onError={handleCoverError} /></figure>
                                <figcaption>Издание из каталога Open Library</figcaption>
                            </div>
                            <div className="book-details-main">
                                <h1>{book.title}</h1>
                                <p className="book-card-author">Автор: {book.author}</p>
                                <section className="book-specs-card">
                                    <h2>Характеристики издания</h2>
                                    <dl className="book-specs-list">
                                        <dt>Жанр / Темы</dt><dd>{book.genreText}</dd>
                                        <dt>Год первой публикации</dt><dd>{book.year}</dd>
                                        <dt>Язык</dt><dd>{book.language}</dd>
                                        <dt>Страниц / Рейтинг</dt><dd>{book.pages} стр. · <Badge variant="neutral">★ {book.rating}</Badge></dd>
                                        <dt>Идентификатор (ID / ISBN)</dt><dd>{book.isbn}</dd>
                                        <dt>Статус</dt><dd><Badge variant="success">В наличии</Badge></dd>
                                    </dl>
                                    <div className="book-details-actions">
                                        <Button variant="wishlist" active={isInWishlist} aria-pressed={isInWishlist} onClick={() => onToggleWishlist({ id: book.id, title: book.title, author: book.author })}>
                                            {isInWishlist ? '✓ В желаемом' : '♡ Хочу прочитать'}
                                        </Button>
                                        <Button variant="secondary" onClick={onBackToCatalog}>&larr; В каталог</Button>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <section className="content-card"><h2>Аннотация к книге</h2><p>{book.description}</p></section>
                    </article>

                    {similar.length > 0 && (
                        <aside className="content-card">
                            <h2>Похожие книги (по жанру и эпохе)</h2>
                            <div className="similar-books-grid">
                                {similar.map((item) => (
                                    <article key={item.id} className="similar-card">
                                        <figure><img src={item.cover || FALLBACK_COVER} alt={item.title} width={180} height={260} loading="lazy" onError={handleCoverError} /></figure>
                                        <h3><a href={`#book/${encodeURIComponent(item.id)}`} onClick={(e) => { e.preventDefault(); onSelectBook(item.id); }}>{item.title}</a></h3>
                                        <p>{item.author} · {item.year} г.</p>
                                    </article>
                                ))}
                            </div>
                        </aside>
                    )}
                </>
            )}
        </div>
    );
}
