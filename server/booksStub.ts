import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

/**
 * Эндпоинт-заглушка для проверки форм (до подключения собственного backend).
 * Работает в `npm run dev` и `npm run preview`, данные хранятся в памяти процесса.
 *
 *   GET  /stub-api/books/:id   - 200 | 404
 *   POST /stub-api/books       - 201 | 409 (дубликат ISBN) | 422 (поля) | 500
 *   PUT  /stub-api/books/:id   - 200 | 409 | 422 | 500 (создаёт запись, если её не было)
 *
 * Сценарии для демонстрации:
 *   название содержит «422» - 422 с ошибками на полях title и author;
 *   название содержит «500» - 500, общая ошибка формы;
 *   ISBN совпадает с уже сохранённой книгой (например 9785171234567) - 409 на поле isbn.
 */

interface StoredBook {
    id: string;
    title: string;
    author: string;
    genre: string;
    year: number;
    isbn: string;
    totalCopies: number;
    availableCopies: number;
    description: string;
}

const RESPONSE_DELAY_MS = 700;

const books = new Map<string, StoredBook>([
    [
        'local-1',
        {
            id: 'local-1',
            title: 'Преступление и наказание',
            author: 'Фёдор Достоевский',
            genre: 'classic',
            year: 1866,
            isbn: '9785171234567',
            totalCopies: 5,
            availableCopies: 3,
            description: 'Роман о нравственном выборе и его последствиях.',
        },
    ],
]);
let nextId = 2;

function normalizeIsbn(value: unknown): string {
    return String(value ?? '').replace(/[-\s]/g, '');
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
            try {
                resolve(JSON.parse(raw) as Record<string, unknown>);
            } catch {
                resolve({});
            }
        });
    });
}

function send(res: ServerResponse, status: number, body: unknown): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
}

function serverRules(input: Record<string, unknown>): Record<string, string> {
    const errors: Record<string, string> = {};
    const title = String(input.title ?? '');
    if (title.includes('422')) {
        errors.title = 'Сервер отклонил название: недопустимое сочетание символов';
        errors.author = 'Сервер не нашёл такого автора в справочнике';
    }
    return errors;
}

async function handle(req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const match = url.pathname.match(/^\/stub-api\/books(?:\/([^/]+))?\/?$/);
    if (!match) return next();

    const id = match[1] ? decodeURIComponent(match[1]) : undefined;
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));

    if (req.method === 'GET' && id) {
        const book = books.get(id);
        return book ? send(res, 200, book) : send(res, 404, { message: 'Книга не найдена' });
    }

    if ((req.method === 'POST' && !id) || (req.method === 'PUT' && id)) {
        const input = await readJson(req);

        if (String(input.title ?? '').includes('500')) {
            return send(res, 500, { message: 'Внутренняя ошибка сервера. Попробуйте позже.' });
        }

        const errors = serverRules(input);
        if (Object.keys(errors).length > 0) {
            return send(res, 422, { message: 'Данные не прошли проверку на сервере', errors });
        }

        const isbn = normalizeIsbn(input.isbn);
        const duplicate = [...books.values()].find((b) => b.isbn === isbn && b.id !== id);
        if (duplicate) {
            return send(res, 409, {
                message: `Книга с таким ISBN уже есть в каталоге: «${duplicate.title}»`,
                field: 'isbn',
            });
        }

        const bookId = id ?? `local-${nextId++}`;
        const saved = { ...input, id: bookId, isbn } as unknown as StoredBook;
        books.set(bookId, saved);
        return send(res, req.method === 'POST' ? 201 : 200, saved);
    }

    return send(res, 405, { message: 'Метод не поддерживается' });
}

export function booksStub(): Plugin {
    const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        void handle(req, res, next);
    };
    return {
        name: 'booknest-books-stub',
        configureServer(server) {
            server.middlewares.use(middleware);
        },
        configurePreviewServer(server) {
            server.middlewares.use(middleware);
        },
    };
}