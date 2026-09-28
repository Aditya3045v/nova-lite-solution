const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');

const TZ = 'Asia/Kolkata';

/** ₹1,23,456.50 (Indian grouping). */
export function formatINR(value: number | string | null | undefined, opts: { decimals?: boolean } = {}): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '₹0';
  return (opts.decimals === false ? inr0 : inr).format(n);
}

/** ₹4.2L, ₹1.3Cr — for KPI cards and chart axes. */
export function formatINRCompact(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (abs >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (abs >= 1e3) return `₹${trim(n / 1e3)}K`;
  return `₹${Math.round(n)}`;
}

function trim(n: number) {
  return (Math.round(n * 10) / 10).toString();
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? num.format(n) : '0';
}

export function formatPercent(value: number | string | null | undefined, digits = 1): string {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(digits).replace(/\.0+$/, '') : '0'}%`;
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value) : value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ, ...opts });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ,
  });
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return formatDate(d);
}

/** Today's date in India as YYYY-MM-DD. */
export function todayIST(): string {
  return toISODateIST(new Date());
}

export function toISODateIST(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function startOfMonthIST(isoDate = todayIST()): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function endOfMonth(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

export function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || 'NL';
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
