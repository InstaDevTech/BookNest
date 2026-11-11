import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react';

export interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    returnFocusRef?: RefObject<HTMLElement | null>;
    children: ReactNode;
}

export function Modal({ isOpen, title, onClose, returnFocusRef, children }: ModalProps) {
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            wasOpenRef.current = true;
            closeButtonRef.current?.focus();
        } else if (wasOpenRef.current) {
            wasOpenRef.current = false;
            returnFocusRef?.current?.focus();
        }
    }, [isOpen, returnFocusRef]);

    if (!isOpen) {
        return null;
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
        }
    };

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-dialog-title"
            onKeyDown={handleKeyDown}
            onClick={handleBackdropClick}
        >
            <div className="wishlist-dialog modal-box">
                <div className="wishlist-dialog-content">
                    <div className="wishlist-dialog-header">
                        <h2 id="modal-dialog-title">{title}</h2>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            className="btn-close"
                            aria-label="Закрыть окно"
                            onClick={onClose}
                        >
                            &times;
                        </button>
                    </div>
                    <div className="wishlist-dialog-body">{children}</div>
                </div>
            </div>
        </div>
    );
}
