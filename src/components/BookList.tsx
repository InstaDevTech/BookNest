import type { Book } from '../types.js';
import { BookCard } from './BookCard.js';

export interface BookListProps {
    books: readonly Book[];
    wishlistIds: ReadonlySet<string>;
    onToggleWishlist: (book: Book) => void;
    onSelectBook: (bookId: string) => void;
}

export function BookList({
    books,
    wishlistIds,
    onToggleWishlist,
    onSelectBook,
}: BookListProps) {
    return (
        <div className="books-grid">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    isInWishlist={wishlistIds.has(book.id)}
                    onToggleWishlist={onToggleWishlist}
                    onSelectBook={onSelectBook}
                />
            ))}
        </div>
    );
}
