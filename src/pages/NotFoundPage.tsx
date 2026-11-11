import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div className="state-box" role="alert">
            <h1 className="state-title">Страница не найдена (404)</h1>
            <p className="state-text">Такого адреса не существует. Проверьте ссылку или вернитесь в каталог.</p>
            <Link className="btn" to="/books">В каталог</Link>
        </div>
    );
}