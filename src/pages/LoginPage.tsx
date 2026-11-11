import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext.js';
import { Button } from '../shared/ui/Button.js';

interface LocationState {
    from?: { pathname: string; search: string };
}

/** Заглушка входа: реальная авторизация будет добавлена в ЛР 9 */
export function LoginPage() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [name, setName] = useState('');

    const from = (location.state as LocationState | null)?.from;
    const target = from ? `${from.pathname}${from.search}` : '/books';

    if (isAuthenticated) {
        return <Navigate to={target} replace />;
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        login(name.trim() || 'Читатель');
        navigate(target, { replace: true });
    };

    return (
        <>
            <h1>Вход</h1>
            <p>Это заглушка: введите любое имя, чтобы получить доступ к списку желаемого.</p>
            <form onSubmit={handleSubmit} className="content-card">
                <label htmlFor="login-name">Имя</label>{' '}
                <input
                    id="login-name"
                    type="text"
                    value={name}
                    placeholder="Читатель"
                    onChange={(event) => setName(event.target.value)}
                />{' '}
                <Button type="submit" variant="primary">Войти</Button>
            </form>
        </>
    );
}