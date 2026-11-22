import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayISO(): string {
  return toDateOnly(new Date());
}

export function addDaysISO(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseDateOnly(fromISO);
  const b = parseDateOnly(toISO);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function daysTogether(sinceISO: string | null): number {
  const base = sinceISO ?? todayISO();
  return Math.max(0, daysBetween(base, todayISO()));
}

export function formatLong(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return 'Sin fecha';
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export function formatShort(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return 'Sin fecha';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortNoYear(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return '';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatMonthTitle(year: number, monthIndex: number): string {
  return format(new Date(year, monthIndex, 1, 12), 'MMMM yyyy', { locale: es });
}

export function formatWeekdayShort(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return 'Sin fecha';
  const label = format(date, 'EEE', { locale: es }).replace('.', '');
  return `${label} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function inDaysLabel(value: string | null): string {
  if (!value) return 'sin fecha';
  const diff = daysBetween(todayISO(), value);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  if (diff < 0) return `hace ${Math.abs(diff)} días`;
  return `en ${diff} días`;
}

export type CalendarCell = {
  iso: string | null;
  day: number | null;
};

export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const first = startOfMonth(new Date(year, monthIndex, 1, 12));
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const total = getDaysInMonth(first);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= total; d++) {
    cells.push({ iso: toDateOnly(new Date(year, monthIndex, d, 12)), day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });
  return cells;
}

export function monthOf(value: string | null): { year: number; month: number } {
  const date = parseDateOnly(value) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

export const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
