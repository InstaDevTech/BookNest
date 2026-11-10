import type { SyntheticEvent } from 'react';
import { FALLBACK_COVER } from '../api/books.js';
import { GENRES } from '../lib/books.js';
import type { Book } from '../types.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';

export interface BookCardProps {
    book: Book;
    isInWishlist: boolean;
    onToggleWishlist: (book: Book) => void;
    onSelectBook: (bookId: string) => void;
}

export function BookCard({
    book,
    isInWishlist,
    onToggleWishlist,
    onSelectBook,
}: BookCardProps) {
    const genreLabel = GENRES[book.genre] ?? 'Классика';
    const birthNote = book.authorBirthDate ? ` (${book.authorBirthDate})` : '';

    const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
        const target = event.currentTarget;
        if (!target.src.endsWith(FALLBACK_COVER)) {
            target.src = FALLBACK_COVER;
        }
    };

    return (
        <article className="book-card">
            <figure>
                <img
                    src={book.cover || FALLBACK_COVER}
                    alt={`Обложка книги «${book.title}»`}
                    width={150}
                    height={220}
                    loading="lazy"
                    onError={handleImageError}
                />
            </figure>

            <h3>
                <a
                    href={`#book/${encodeURIComponent(book.id)}`}
                    onClick={(event) => {
                        event.preventDefault();
                        onSelectBook(book.id);
                    }}
                >
                    {book.title}
                </a>
            </h3>

            <p className="book-card-author">
                Автор: {book.author}
                {birthNote}
            </p>
            <p>Жанр: {genreLabel}</p>
            <p>
                Год: {book.year} · Рейтинг: ★ {book.rating.toFixed(1)}
            </p>

            <Badge variant={book.available ? 'success' : 'danger'}>
                {book.available ? 'В наличии' : 'Нет в наличии'}
            </Badge>

            <div className="book-card-actions">
                <Button
                    variant="wishlist"
                    active={isInWishlist}
                    aria-pressed={isInWishlist}
                    onClick={() => onToggleWishlist(book)}
                >
                    {isInWishlist ? '✓ В желаемом' : '♡ Хочу прочитать'}
                </Button>

                <Button variant="secondary" onClick={() => onSelectBook(book.id)}>
                    Подробнее о книге
                </Button>
            </div>
        </article>
    );
}
