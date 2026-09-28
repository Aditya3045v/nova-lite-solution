export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadCSV<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob(['﻿' + toCSV(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
