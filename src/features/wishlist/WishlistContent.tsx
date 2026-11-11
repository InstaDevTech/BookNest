import { Link, useNavigate } from 'react-router-dom';
import type { WishlistItem } from '../../api/types.js';
import { Button } from '../../shared/ui/Button.js';
import { EmptyState } from '../../shared/ui/EmptyState.js';

export interface WishlistContentProps {
    items: readonly WishlistItem[];
    onRemove: (bookId: string) => void;
}

export function WishlistContent({ items, onRemove }: WishlistContentProps) {
    const navigate = useNavigate();

    if (items.length === 0) {
        return (
            <EmptyState
                title="Ваш список пока пуст"
                description="Добавьте понравившиеся книги кнопкой «Хочу прочитать» на карточке издания."
                actionLabel="Перейти к книгам"
                onAction={() => navigate('/books')}
            />
        );
    }

    return (
        <ul className="wishlist-list">
            {items.map((item) => (
                <li key={item.id} className="wishlist-item">
                    <Link to={`/books/${encodeURIComponent(item.id)}`} className="wishlist-item-title">
                        {item.title} ({item.author})
                    </Link>

                    <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Удалить «${item.title}» из списка`}
                        onClick={() => onRemove(item.id)}
                    >
                        Удалить
                    </Button>
                </li>
            ))}
        </ul>
    );
}
