import type { FormEvent } from 'react';
import type { CatalogFilters, GenreFilter, SortOption } from '../types.js';
import { Button } from './Button.js';

export interface FiltersPanelProps {
    searchDraft: string;
    filters: CatalogFilters;
    sortBy: SortOption;
    minQueryLength: number;
    onSearchDraftChange: (value: string) => void;
    onGenreChange: (genre: GenreFilter) => void;
    onSortChange: (sort: SortOption) => void;
    onAvailableChange: (onlyAvailable: boolean) => void;
    onSubmitSearch: () => void;
    onReset: () => void;
}

export function FiltersPanel({
    searchDraft,
    filters,
    sortBy,
    minQueryLength,
    onSearchDraftChange,
    onGenreChange,
    onSortChange,
    onAvailableChange,
    onSubmitSearch,
    onReset,
}: FiltersPanelProps) {
    const trimmed = searchDraft.trim();
    const isTooShort = trimmed.length > 0 && trimmed.length < minQueryLength;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmitSearch();
    };

    return (
        <section aria-labelledby="filters-title">
            <h2 id="filters-title">Фильтры каталога</h2>
            <form action="#" method="get" className="form-box" onSubmit={handleSubmit}>
                <fieldset>
                    <legend>Параметры поиска</legend>

                    <p className="form-group">
                        <label htmlFor="search-input">Поиск по названию или автору</label>
                        <input
                            type="search"
                            id="search-input"
                            name="query"
                            placeholder="Например, Достоевский (мин. 2 символа)"
                            minLength={minQueryLength}
                            className="form-control"
                            value={searchDraft}
                            onChange={(event) => onSearchDraftChange(event.target.value)}
                        />
                        <small
                            className={`form-hint ${isTooShort ? 'form-hint--warning' : ''}`}
                        >
                            {isTooShort
                                ? `Введите ещё хотя бы ${minQueryLength - trimmed.length} симв. для отправки запроса`
                                : 'Введите минимум 2 символа для поиска по API'}
                        </small>
                    </p>

                    <p className="form-group">
                        <label htmlFor="genre-select">Жанр:</label>
                        <select
                            id="genre-select"
                            name="genre"
                            className="form-control"
                            value={filters.genre}
                            onChange={(event) =>
                                onGenreChange(event.target.value as GenreFilter)
                            }
                        >
                            <option value="">Все Жанры</option>
                            <option value="classic">Классика</option>
                            <option value="sci-fi">Научная Фантастика</option>
                            <option value="romance">Роман</option>
                            <option value="satire">Сатира</option>
                            <option value="detective">Детектив</option>
                        </select>
                    </p>

                    <p className="form-group">
                        <label htmlFor="sort-select">Сортировка:</label>
                        <select
                            id="sort-select"
                            name="sort"
                            className="form-control"
                            value={sortBy}
                            onChange={(event) =>
                                onSortChange(event.target.value as SortOption)
                            }
                        >
                            <option value="title">По названию (А–Я)</option>
                            <option value="year">Новинки (новые сначала)</option>
                            <option value="rating">По рейтингу</option>
                        </select>
                    </p>

                    <p className="form-checkbox">
                        <input
                            type="checkbox"
                            id="available-only"
                            name="available"
                            checked={filters.onlyAvailable}
                            onChange={(event) => onAvailableChange(event.target.checked)}
                        />
                        <label htmlFor="available-only">Только доступные</label>
                    </p>

                    <div className="form-actions">
                        <Button type="submit" variant="primary">
                            Применить
                        </Button>
                        <Button type="button" variant="secondary" onClick={onReset}>
                            Сбросить
                        </Button>
                    </div>
                </fieldset>
            </form>
        </section>
    );
}
