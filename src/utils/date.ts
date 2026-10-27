export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
export const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

export const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

export type SelectedDateResult = {
  day: number;
  monthIndex: number; // 0 - 11
  year: number;
  dayName: string;
  monthName: string;
  shortMonth: string;
  displayDate: string; // "27 Okt 2026"
  fullDisplay: string; // "Selasa, 27 Okt 2026"
  isoDate: string; // "2026-10-27"
  isToday: boolean;
};

export function getDeviceNow(): SelectedDateResult {
  const now = new Date();
  const day = now.getDate();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const dayOfWeek = now.getDay();

  const dayName = DAY_NAMES[dayOfWeek];
  const shortMonth = SHORT_MONTHS[monthIndex];
  const monthName = MONTH_NAMES[monthIndex];
  const displayDate = `${day} ${shortMonth} ${year}`;
  const fullDisplay = `${dayName}, ${day} ${shortMonth} ${year}`;
  const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    day,
    monthIndex,
    year,
    dayName,
    monthName,
    shortMonth,
    displayDate,
    fullDisplay,
    isoDate,
    isToday: true,
  };
}

export function buildDateResult(year: number, monthIndex: number, day: number): SelectedDateResult {
  const dateObj = new Date(year, monthIndex, day);
  const safeDay = dateObj.getDate();
  const safeMonthIndex = dateObj.getMonth();
  const safeYear = dateObj.getFullYear();
  const dayOfWeek = dateObj.getDay();

  const now = new Date();
  const isToday =
    safeDay === now.getDate() &&
    safeMonthIndex === now.getMonth() &&
    safeYear === now.getFullYear();

  const dayName = DAY_NAMES[dayOfWeek];
  const shortMonth = SHORT_MONTHS[safeMonthIndex];
  const monthName = MONTH_NAMES[safeMonthIndex];
  const displayDate = `${safeDay} ${shortMonth} ${safeYear}`;
  const fullDisplay = `${dayName}, ${safeDay} ${shortMonth} ${safeYear}`;
  const isoDate = `${safeYear}-${String(safeMonthIndex + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

  return {
    day: safeDay,
    monthIndex: safeMonthIndex,
    year: safeYear,
    dayName,
    monthName,
    shortMonth,
    displayDate,
    fullDisplay,
    isoDate,
    isToday,
  };
}

export function getCurrentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentPeriodLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

export function parseIsoOrDisplayDate(input: string): SelectedDateResult {
  if (!input) return getDeviceNow();

  // 1. Try ISO YYYY-MM-DD
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return buildDateResult(y, m, d);
  }

  // 2. Try parsing string like "27 Okt 2026" or "27 Okt"
  const clean = input.toLowerCase();
  const dayMatch = clean.match(/\b([1-9]|[12][0-9]|3[01])\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : new Date().getDate();

  let monthIndex = new Date().getMonth();
  SHORT_MONTHS.forEach((m, idx) => {
    if (clean.includes(m.toLowerCase())) {
      monthIndex = idx;
    }
  });

  const yearMatch = clean.match(/\b(20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  return buildDateResult(year, monthIndex, day);
}

export function formatToDisplay(isoOrStringDate: string): string {
  const parsed = parseIsoOrDisplayDate(isoOrStringDate);
  return `${parsed.day} ${parsed.shortMonth} ${parsed.year}`;
}
