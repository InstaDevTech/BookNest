import { ApiError } from '../api/client.js';
import { Button } from './Button.js';

export interface ErrorBoxProps {
    error: ApiError | Error | null;
    onRetry: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

function resolveErrorMessage(error: ApiError | Error | null): { title: string; text: string } {
    if (!error) {
        return {
            title: 'Неизвестная ошибка',
            text: 'Произошла непредвиденная ошибка при обращении к серверу.',
        };
    }

    const status = error instanceof ApiError ? error.status : 0;

    if (status === 0) {
        return {
            title: 'Отсутствует подключение к сети',
            text: 'Не удалось связаться с сервером Open Library. Проверьте подключение к интернету (режим Offline) и нажмите «Повторить».',
        };
    }

    if (status === 404) {
        return {
            title: 'Данные не найдены (Ошибка 404)',
            text: 'Запрашиваемая книга или страница API не существует. Проверьте идентификатор или вернитесь в каталог.',
        };
    }

    if (status >= 400 && status < 500) {
        return {
            title: `Ошибка запроса (Код ${status})`,
            text: 'Сервер отклонил запрос из-за некорректных параметров или ограничений доступа (4xx).',
        };
    }

    if (status >= 500) {
        return {
            title: `Ошибка сервера Open Library (Код ${status})`,
            text: 'На стороне внешнего сервера произошел сбой (5xx). Мы уже выполнили автоматический повтор — попробуйте ещё раз чуть позже.',
        };
    }

    return {
        title: 'Ошибка загрузки данных',
        text: error.message || 'Попробуйте повторить запрос.',
    };
}

export function ErrorBox({
    error,
    onRetry,
    secondaryActionLabel,
    onSecondaryAction,
}: ErrorBoxProps) {
    const { title, text } = resolveErrorMessage(error);

    return (
        <div className="state-box error-state" role="alert">
            <p className="state-title">{title}</p>
            <p className="state-text">{text}</p>
            <div className="book-details-actions">
                <Button variant="primary" onClick={onRetry}>
                    Повторить
                </Button>
                {secondaryActionLabel && onSecondaryAction && (
                    <Button variant="secondary" onClick={onSecondaryAction}>
                        {secondaryActionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
