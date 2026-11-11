import { useCallback } from 'react';
import { createBook, updateBook } from '../../api/localBooks.js';
import type { StoredBook } from '../../api/types.js';
import { toBookInput, type BookFormValues } from './schema.js';

export type BookFormMode = 'create' | 'edit';

/** Отправка формы: создание (POST) или обновление (PUT) записи через слой API */
export function useSaveBook(mode: BookFormMode, bookId: string | undefined) {
    return useCallback(
        (values: BookFormValues): Promise<StoredBook> => {
            const input = toBookInput(values);
            return mode === 'edit' && bookId ? updateBook(bookId, input) : createBook(input);
        },
        [mode, bookId]
    );
}