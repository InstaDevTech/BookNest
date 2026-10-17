import { useState, type ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
}

export interface DataTableProps<T> {
    items: readonly T[];
    columns: readonly DataTableColumn<T>[];
    getRowKey: (item: T) => string;
    caption?: string;
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
    const multiplier = direction === 'asc' ? 1 : -1;

    if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * multiplier;
    }

    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return (Number(a) - Number(b)) * multiplier;
    }

    const strA = String(a ?? '');
    const strB = String(b ?? '');
    return strA.localeCompare(strB, 'ru', { numeric: true }) * multiplier;
}

export function DataTable<T>({
    items,
    columns,
    getRowKey,
    caption,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [direction, setDirection] = useState<SortDirection>('asc');

    const handleHeaderClick = (col: DataTableColumn<T>) => {
        if (!col.sortable) return;
        if (sortKey === col.key) {
            setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(col.key);
            setDirection('asc');
        }
    };

    const sortedItems = sortKey
        ? [...items].sort((a, b) => compareValues(a[sortKey], b[sortKey], direction))
        : items;

    return (
        <div className="data-table-wrapper">
            <table className="data-table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {columns.map((col) => {
                            const isCurrent = sortKey === col.key;
                            const arrow = isCurrent ? (direction === 'asc' ? ' ▲' : ' ▼') : '';

                            return (
                                <th key={String(col.key)} scope="col">
                                    {col.sortable ? (
                                        <button
                                            type="button"
                                            className="data-table-sort-btn"
                                            onClick={() => handleHeaderClick(col)}
                                        >
                                            {col.header}
                                            {arrow}
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map((item) => (
                        <tr key={getRowKey(item)}>
                            {columns.map((col) => (
                                <td key={String(col.key)}>
                                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
