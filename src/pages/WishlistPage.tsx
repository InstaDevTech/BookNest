import { WishlistContent } from '../features/wishlist/WishlistContent.js';
import { useWishlist } from '../features/wishlist/useWishlist.js';

export function WishlistPage() {
    const wishlist = useWishlist();

    return (
        <>
            <h1>Мой список желаемого</h1>
            <WishlistContent items={wishlist.items} onRemove={wishlist.remove} />
        </>
    );
}