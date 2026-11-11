import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FALLBACK_COVER } from '../../api/books.js';
import { useBook } from './useBook.js';
import type { UiState } from '../../api/types.js';
import { Badge } from '../../shared/ui/Badge.js';
import { Button } from '../../shared/ui/Button.js';
import { ErrorBox } from '../../shared/ui/ErrorBox.js';
import { Spinner } from '../../shared/ui/Spinner.js';

export interface BookDetailsViewProps {
    bookId: string;
    isInWishlist: boolean;
    onToggleWishlist: (item: { id: string; title: string; author: string }) => void;
}

export function BookDetailsView({
    bookId,
    isInWishlist,
    onToggleWishlist,
}: BookDetailsViewProps) {
    const navigate = useNavigate();
    const { data, error, status, reload } = useBook(bookId);
    const uiState: UiState = status;
    const book = data?.book ?? null;
    const similar = data?.similar ?? [];
    const handleCoverError = (event: SyntheticEvent<HTMLImageElement>) => {
        const target = event.currentTarget;
        if (!target.src.endsWith(FALLBACK_COVER)) target.src = FALLBACK_COVER;
    };

    return (
        <div>
            <nav aria-label="Хлебные крошки" className="breadcrumbs">
                <ol>
                    <li><Link to="/books">Каталог</Link></li>
                    <li aria-current="page">{uiState === 'success' && book ? book.title : 'Карточка книги'}</li>
                </ol>
            </nav>

            {uiState === 'loading' && <Spinner title="Загружаем карточку книги из Open Library..." />}
            {uiState === 'error' && (
                <ErrorBox error={error} onRetry={reload} secondaryActionLabel="Вернуться в каталог" onSecondaryAction={() => navigate('/books')} />
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
                                        <Link className="btn btn-secondary" to="/books">&larr; В каталог</Link>
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
                                        <h3><Link to={`/books/${encodeURIComponent(item.id)}`}>{item.title}</Link></h3>
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

