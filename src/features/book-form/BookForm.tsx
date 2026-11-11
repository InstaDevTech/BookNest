import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm, type DefaultValues } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client.js';
import { GENRES } from '../../api/genres.js';
import type { GenreKey } from '../../api/types.js';
import { useUnsavedChangesGuard } from '../../shared/hooks/useUnsavedChangesGuard.js';
import { Button } from '../../shared/ui/Button.js';
import { FormField } from '../../shared/ui/FormField.js';
import { Modal } from '../../shared/ui/Modal.js';
import { bookSchema, isFormField, type BookFormValues } from './schema.js';
import { useSaveBook, type BookFormMode } from './useSaveBook.js';

export interface BookFormProps {
    mode: BookFormMode;
    bookId?: string;
    /** Предзаполнение при редактировании */
    defaultValues?: DefaultValues<BookFormValues>;
}

const EMPTY_VALUES: DefaultValues<BookFormValues> = {
    title: '',
    author: '',
    isbn: '',
    description: '',
};

export function BookForm({ mode, bookId, defaultValues }: BookFormProps) {
    const navigate = useNavigate();
    const save = useSaveBook(mode, bookId);
    const [formError, setFormError] = useState<string | null>(null);
    const isLeavingAfterSave = useRef(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<BookFormValues>({
        resolver: zodResolver(bookSchema),
        defaultValues: defaultValues ?? EMPTY_VALUES,
        mode: 'onTouched',
    });

    const blocker = useUnsavedChangesGuard(isDirty, () => isLeavingAfterSave.current);

    const applyServerError = (error: unknown) => {
        if (!(error instanceof ApiError)) {
            setFormError('Не удалось сохранить книгу. Попробуйте ещё раз.');
            return;
        }

        // 422 и 409: ошибки показываются на конкретных полях
        const generalMessages: string[] = [];
        let isFirst = true;
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
            if (isFormField(field)) {
                setError(field, { type: 'server', message }, { shouldFocus: isFirst });
                isFirst = false;
            } else {
                generalMessages.push(message);
            }
        });

        if (isFirst) {
            // Поля не названы (например 500 или сеть) - общая ошибка формы
            setFormError(error.status === 0 ? 'Нет соединения с сервером. Проверьте сеть и повторите.' : error.message);
        } else if (generalMessages.length > 0) {
            setFormError(generalMessages.join(' '));
        }
    };

    const onSubmit = async (values: BookFormValues) => {
        setFormError(null);
        try {
            const saved = await save(values);
            isLeavingAfterSave.current = true;
            navigate(`/books/${encodeURIComponent(saved.id)}`);
        } catch (error: unknown) {
            applyServerError(error);
        }
    };

    return (
        <>
            <form
                noValidate
                className="book-form content-card"
                aria-busy={isSubmitting}
                onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            >
                {formError && (
                    <div className="form-error" role="alert">
                        {formError}
                    </div>
                )}

                <div className="form-grid">
                    <FormField id="book-title" label="Название" error={errors.title?.message}>
                        {(control) => <input type="text" className="form-control" {...control} {...register('title')} />}
                    </FormField>

                    <FormField id="book-author" label="Автор" error={errors.author?.message}>
                        {(control) => <input type="text" className="form-control" {...control} {...register('author')} />}
                    </FormField>

                    <FormField id="book-genre" label="Жанр" error={errors.genre?.message}>
                        {(control) => (
                            <select className="form-control" {...control} {...register('genre')}>
                                <option value="">Выберите жанр</option>
                                {(Object.keys(GENRES) as GenreKey[]).map((key) => (
                                    <option key={key} value={key}>
                                        {GENRES[key]}
                                    </option>
                                ))}
                            </select>
                        )}
                    </FormField>

                    <FormField id="book-year" label="Год публикации" error={errors.year?.message}>
                        {(control) => (
                            <input type="number" inputMode="numeric" className="form-control" {...control} {...register('year', { valueAsNumber: true })} />
                        )}
                    </FormField>

                    <FormField
                        id="book-isbn"
                        label="ISBN"
                        hint="10 или 13 цифр, например 978-5-17-123456-7"
                        error={errors.isbn?.message}
                    >
                        {(control) => <input type="text" className="form-control" {...control} {...register('isbn')} />}
                    </FormField>

                    <FormField id="book-total" label="Всего экземпляров" error={errors.totalCopies?.message}>
                        {(control) => (
                            <input type="number" inputMode="numeric" className="form-control" {...control} {...register('totalCopies', { valueAsNumber: true })} />
                        )}
                    </FormField>

                    <FormField id="book-available" label="Доступно экземпляров" error={errors.availableCopies?.message}>
                        {(control) => (
                            <input type="number" inputMode="numeric" className="form-control" {...control} {...register('availableCopies', { valueAsNumber: true })} />
                        )}
                    </FormField>
                </div>

                <FormField id="book-description" label="Аннотация" error={errors.description?.message}>
                    {(control) => <textarea rows={5} className="form-control" {...control} {...register('description')} />}
                </FormField>

                <div className="book-details-actions">
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохраняем...' : mode === 'edit' ? 'Сохранить изменения' : 'Создать книгу'}
                    </Button>
                    <Button variant="secondary" disabled={isSubmitting} onClick={() => navigate(-1)}>
                        Отмена
                    </Button>
                </div>
            </form>

            <Modal
                isOpen={blocker.state === 'blocked'}
                title="Несохранённые изменения"
                onClose={() => blocker.reset?.()}
            >
                <p>В форме есть несохранённые изменения. Если уйти со страницы, они будут потеряны.</p>
                <div className="book-details-actions">
                    <Button variant="primary" onClick={() => blocker.reset?.()}>
                        Остаться
                    </Button>
                    <Button variant="danger" onClick={() => blocker.proceed?.()}>
                        Уйти без сохранения
                    </Button>
                </div>
            </Modal>
        </>
    );
}