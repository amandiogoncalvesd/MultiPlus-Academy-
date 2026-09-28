import React, { useState, useMemo } from 'react';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface DashboardTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function DashboardTable<T = any>({
  columns,
  data,
  title,
  subtitle,
  emptyMessage = 'Nenhum dado encontrado.',
  className = '',
  searchable = true,
  searchPlaceholder = 'Pesquisar...',
}: DashboardTableProps<T>) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row: any) =>
      columns.some((col) => {
        const val = row[col.key];
        const text = typeof val === 'string' || typeof val === 'number' ? String(val) : '';
        return text.toLowerCase().includes(q);
      })
    );
  }, [data, query, columns, searchable]);

  return (
    <section className={`rounded-3xl border border-[#EAE6DF] bg-white shadow-xs dark:border-[#273244] dark:bg-[#101827] ${className}`.trim()} aria-label={title || 'Tabela'}>
      {(title || subtitle || searchable) && (
        <div className="flex flex-col gap-3 border-b border-[#EAE6DF] px-5 py-4 dark:border-[#273244] sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h3 className="font-serif text-lg font-black text-[#0B1629] dark:text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-[#78716C]">{subtitle}</p>}
          </div>
          {searchable && (
            <label className="relative w-full sm:max-w-sm">
              <span className="sr-only">Pesquisar</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] pl-9 pr-3 py-2 text-xs outline-none focus:border-[#A16207] focus:ring-2 focus:ring-[#A16207]/10 transition dark:border-[#273244] dark:bg-[#0B111C] dark:text-white"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </label>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-[#FAFAF9] text-[#78716C] dark:bg-[#0B111C]">
            <tr className="border-b border-[#EAE6DF] dark:border-[#273244]">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[.14em] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`.trim()} style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE6DF] dark:divide-[#273244]">
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[#78716C]">{emptyMessage}</td></tr>
            ) : (
              filtered.map((row: any, idx: number) => (
                <tr key={idx} className="transition hover:bg-[#FAFAF9] dark:hover:bg-[#0B111C]/60">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-[#1C1917] dark:text-white ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`.trim()}>
                      {col.render ? col.render(row, idx) : <span className="truncate block max-w-[200px]">{String(row[col.key] ?? '')}</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
