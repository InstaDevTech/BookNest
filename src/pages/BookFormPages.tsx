import { useParams } from 'react-router-dom';
import { ErrorBox } from '../shared/ui/ErrorBox.js';
import { Spinner } from '../shared/ui/Spinner.js';
import { BookForm } from '../features/book-form/BookForm.js';
import { useBookForEdit } from '../features/book-form/useBookForEdit.js';

export function BookCreatePage() {
    return (
        <>
            <h1>Добавить книгу</h1>
            <BookForm mode="create" />
        </>
    );
}

export function BookEditPage() {
    const { bookId = '' } = useParams<{ bookId: string }>();
    const { data, error, status, reload } = useBookForEdit(bookId);

    return (
        <>
            <h1>Редактирование книги</h1>
            {status === 'loading' && <Spinner title="Загружаем данные книги..." />}
            {status === 'error' && <ErrorBox error={error} onRetry={reload} />}
            {status === 'success' && data && <BookForm key={bookId} mode="edit" bookId={bookId} defaultValues={data} />}
        </>
    );
}
