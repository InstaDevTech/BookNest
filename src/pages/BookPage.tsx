import { useParams } from 'react-router-dom';
import { BookDetailsView } from '../features/book-details/BookDetailsView.js';
import { useWishlist } from '../features/wishlist/useWishlist.js';

export function BookPage() {
    // useParams всегда возвращает строку - идентификатор книги строковый (OL...W)
    const { bookId = '' } = useParams<{ bookId: string }>();
    const wishlist = useWishlist();

    return (
        <BookDetailsView
            bookId={bookId}
            isInWishlist={wishlist.ids.has(bookId)}
            onToggleWishlist={wishlist.toggle}
        />
    );
}