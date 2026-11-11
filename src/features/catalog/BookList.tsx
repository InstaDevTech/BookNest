import type { Book } from '../../api/types.js';
import { BookCard } from './BookCard.js';

export interface BookListProps {
    books: readonly Book[];
    wishlistIds: ReadonlySet<string>;
    onToggleWishlist: (book: Book) => void;
}

export function BookList({
    books,
    wishlistIds,
    onToggleWishlist,
}: BookListProps) {
    return (
        <div className="books-grid">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    isInWishlist={wishlistIds.has(book.id)}
                    onToggleWishlist={onToggleWishlist}
                />
            ))}
        </div>
    );
}
