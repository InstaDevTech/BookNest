export interface SpinnerProps {
    title?: string;
    subtitle?: string;
}

export function Spinner({
    title = 'Загружаем книги из Open Library...',
    subtitle = 'Пожалуйста, подождите, выполняется сетевой запрос.',
}: SpinnerProps) {
    return (
        <div className="state-box loading-state" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p className="state-title">{title}</p>
            <p className="state-text">{subtitle}</p>
        </div>
    );
}
