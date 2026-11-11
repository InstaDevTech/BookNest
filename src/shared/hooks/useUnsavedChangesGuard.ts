import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Защита от потери несохранённых изменений: блокирует переход на другую страницу
 * (возвращает blocker для подтверждения) и закрытие вкладки.
 */
export function useUnsavedChangesGuard(isDirty: boolean, isBypassed: () => boolean) {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && !isBypassed() && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (!isDirty) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return blocker;
}