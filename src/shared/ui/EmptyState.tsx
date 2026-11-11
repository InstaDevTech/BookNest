import { Button } from './Button.js';

export interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    title = 'Ничего не найдено',
    description = 'По вашему запросу нет подходящих книг. Попробуйте изменить запрос или сбросить фильтры.',
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="state-box empty-state">
            <p className="empty-state-title">{title}</p>
            <p className="empty-state-text">{description}</p>
            {actionLabel && onAction && (
                <Button variant="secondary" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
