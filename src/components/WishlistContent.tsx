import type { WishlistItem } from '../types.js';
import { Button } from './Button.js';
import { EmptyState } from './EmptyState.js';

export interface WishlistContentProps {
    items: readonly WishlistItem[];
    onRemove: (bookId: string) => void;
    onSelectBook: (bookId: string) => void;
    onClose: () => void;
}

export function WishlistContent({
    items,
    onRemove,
    onSelectBook,
    onClose,
}: WishlistContentProps) {
    if (items.length === 0) {
        return (
            <EmptyState
                title="Ваш список пока пуст"
                description="Добавьте понравившиеся книги кнопкой «Хочу прочитать» на карточке издания."
                actionLabel="Перейти к книгам"
                onAction={onClose}
            />
        );
    }

    return (
        <ul className="wishlist-list">
            {items.map((item) => (
                <li key={item.id} className="wishlist-item">
                    <a
                        href={`#book/${encodeURIComponent(item.id)}`}
                        className="wishlist-item-title"
                        onClick={(event) => {
                            event.preventDefault();
                            onSelectBook(item.id);
                            onClose();
                        }}
                    >
                        {item.title} ({item.author})
                    </a>

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
