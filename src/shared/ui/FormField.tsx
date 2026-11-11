import type { ReactNode } from 'react';

export interface FieldControlProps {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
}

export interface FormFieldProps {
    id: string;
    label: string;
    error?: string | undefined;
    hint?: string;
    /** Render-prop: передаёт полю id и aria-атрибуты, связывающие его с подсказкой и ошибкой */
    children: (control: FieldControlProps) => ReactNode;
}

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            {children({
                id,
                'aria-invalid': Boolean(error),
                'aria-describedby': describedBy || undefined,
            })}
            {hint && (
                <p id={hintId} className="form-hint">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}