import { z } from 'zod';
import { GENRES } from '../../api/genres.js';
import type { BookInput, GenreKey } from '../../api/types.js';

const GENRE_KEYS = Object.keys(GENRES) as [GenreKey, ...GenreKey[]];
const CURRENT_YEAR = new Date().getFullYear();

const numberField = (message: string) => z.number({ error: message });

/**
 * Единственное место, где описаны правила валидации формы книги.
 * Атрибуты полей (required, min, max) не дублируют схему, форма использует noValidate.
 */
export const bookSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, 'Название: минимум 2 символа')
            .max(120, 'Название: не более 120 символов'),
        author: z.string().trim().min(2, 'Укажите автора (минимум 2 символа)'),
        genre: z.enum(GENRE_KEYS, { error: 'Выберите жанр из списка' }),
        year: numberField('Укажите год публикации числом')
            .int('Год должен быть целым числом')
            .min(1000, 'Год публикации не может быть раньше 1000')
            .max(CURRENT_YEAR, `Год публикации не может быть позже ${CURRENT_YEAR}`),
        isbn: z
            .string()
            .trim()
            .refine(
                (value) => /^(\d{9}[\dXx]|\d{13})$/.test(value.replace(/[-\s]/g, '')),
                'ISBN должен содержать 10 или 13 цифр (дефисы допустимы)'
            ),
        totalCopies: numberField('Укажите общее число экземпляров')
            .int('Число экземпляров должно быть целым')
            .min(1, 'Должен быть минимум 1 экземпляр')
            .max(1000, 'Не более 1000 экземпляров'),
        availableCopies: numberField('Укажите число доступных экземпляров')
            .int('Число экземпляров должно быть целым')
            .min(0, 'Число доступных экземпляров не может быть отрицательным'),
        description: z.string().trim().max(1000, 'Аннотация: не более 1000 символов'),
    })
    // Межполевое правило: сравнение двух значений
    .refine((values) => values.availableCopies <= values.totalCopies, {
        path: ['availableCopies'],
        message: 'Доступных экземпляров не может быть больше, чем всего',
    });

export type BookFormValues = z.infer<typeof bookSchema>;

// Тип значений формы совместим с контрактом API (проверяется компилятором)
export const toBookInput = (values: BookFormValues): BookInput => values;

export const FORM_FIELDS = [
    'title',
    'author',
    'genre',
    'year',
    'isbn',
    'totalCopies',
    'availableCopies',
    'description',
] as const satisfies readonly (keyof BookFormValues)[];

export type FormFieldName = (typeof FORM_FIELDS)[number];

export function isFormField(name: string): name is FormFieldName {
    return (FORM_FIELDS as readonly string[]).includes(name);
}