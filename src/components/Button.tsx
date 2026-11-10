import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ButtonVariant } from '../types.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: 'md' | 'sm';
    active?: boolean;
    children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: 'btn',
    secondary: 'btn btn-secondary',
    outline: 'btn btn-outline',
    danger: 'btn btn-danger',
    wishlist: 'btn btn-wishlist',
};

export function Button({
    variant = 'primary',
    size = 'md',
    active = false,
    className = '',
    type = 'button',
    children,
    ...rest
}: ButtonProps) {
    const classes = [VARIANT_CLASSES[variant]];

    if (size === 'sm') {
        classes.push('btn-sm');
    }
    if (variant === 'wishlist' && active) {
        classes.push('btn-wishlist--active');
    }
    if (className) {
        classes.push(className);
    }

    return (
        <button type={type} className={classes.join(' ')} {...rest}>
            {children}
        </button>
    );
}
