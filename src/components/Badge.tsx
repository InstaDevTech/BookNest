import type { ReactNode } from 'react';
import type { BadgeVariant } from '../types.js';

export interface BadgeProps {
    variant?: BadgeVariant;
    className?: string;
    children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    accent: 'badge',
    success: 'book-card-status book-card-status--available',
    danger: 'book-card-status book-card-status--unavailable',
    neutral: 'review-card-rating',
};

export function Badge({ variant = 'accent', className = '', children }: BadgeProps) {
    const baseClass = VARIANT_CLASSES[variant];
    const combinedClass = className ? `${baseClass} ${className}` : baseClass;

    return <span className={combinedClass}>{children}</span>;
}
