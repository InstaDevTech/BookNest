export type GenreKey = 'classic' | 'sci-fi' | 'romance' | 'satire' | 'detective';

export type GenreFilter = GenreKey | '';

export type SortOption = 'title' | 'year' | 'rating';

export type UiState = 'loading' | 'success' | 'empty' | 'error';

export type ThemeMode = 'light' | 'dark';

export type CatalogViewMode = 'grid' | 'table';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'wishlist';

export type BadgeVariant = 'accent' | 'success' | 'danger' | 'neutral';

export interface Book {
    id: string;
    title: string;
    author: string;
    authorKey: string | null;
    authorBirthDate?: string;
    year: number | string;
    genre: GenreKey;
    rating: number;
    available: boolean;
    cover: string;
    pages: number | null;
    isbn: string | null;
    language: string;
}

export interface BookDetails {
    id: string;
    title: string;
    author: string;
    genreText: string;
    year: string;
    language: string;
    pages: string;
    isbn: string;
    available: boolean;
    cover: string;
    description: string;
    rating: number;
    ratingsCount: number;
    subjects: string[];
}

export interface CatalogFilters {
    query: string;
    genre: GenreFilter;
    onlyAvailable: boolean;
}

export interface WishlistItem {
    id: string;
    title: string;
    author: string;
}

export interface SearchBooksResult {
    books: Book[];
    totalFound: number;
    page: number;
    totalPages: number;
}
