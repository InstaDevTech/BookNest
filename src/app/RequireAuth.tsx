import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext.js';

/** Защищённые маршруты: гость перенаправляется на /login и возвращается после входа */
export function RequireAuth() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}