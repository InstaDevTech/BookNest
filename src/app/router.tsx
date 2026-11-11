import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BookPage } from '../pages/BookPage.js';
import { CatalogPage } from '../pages/CatalogPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { WishlistPage } from '../pages/WishlistPage.js';
import { Layout } from './layout/Layout.js';
import { RequireAuth } from './RequireAuth.js';

// Маршруты форм загружаются лениво: react-hook-form и zod не попадают в основной бандл
const BookCreatePage = lazy(() =>
    import('../pages/BookFormPages.js').then((m) => ({ default: m.BookCreatePage }))
);
const BookEditPage = lazy(() =>
    import('../pages/BookFormPages.js').then((m) => ({ default: m.BookEditPage }))
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Navigate to="/books" replace /> },
            { path: 'books', element: <CatalogPage /> },
            { path: 'books/new', element: <BookCreatePage /> },
            { path: 'books/:bookId', element: <BookPage /> },
            { path: 'books/:bookId/edit', element: <BookEditPage /> },
            {
                element: <RequireAuth />,
                children: [{ path: 'wishlist', element: <WishlistPage /> }],
            },
            { path: 'login', element: <LoginPage /> },
            { path: '*', element: <NotFoundPage /> },
        ],
    },
]);