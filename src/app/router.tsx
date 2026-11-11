import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BookPage } from '../pages/BookPage.js';
import { CatalogPage } from '../pages/CatalogPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { WishlistPage } from '../pages/WishlistPage.js';
import { Layout } from './layout/Layout.js';
import { RequireAuth } from './RequireAuth.js';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Navigate to="/books" replace /> },
            { path: 'books', element: <CatalogPage /> },
            { path: 'books/:bookId', element: <BookPage /> },
            {
                element: <RequireAuth />,
                children: [{ path: 'wishlist', element: <WishlistPage /> }],
            },
            { path: 'login', element: <LoginPage /> },
            { path: '*', element: <NotFoundPage /> },
        ],
    },
]);