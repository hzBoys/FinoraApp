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

const MONTH_ALIASES: { pattern: RegExp; index: number }[] = [
  { pattern: /\b(januari|january|jan)\b/i, index: 0 },
  { pattern: /\b(februari|february|feb)\b/i, index: 1 },
  { pattern: /\b(maret|march|mar)\b/i, index: 2 },
  { pattern: /\b(april|apr)\b/i, index: 3 },
  { pattern: /\b(mei|may)\b/i, index: 4 },
  { pattern: /\b(juni|june|jun)\b/i, index: 5 },
  { pattern: /\b(juli|july|jul)\b/i, index: 6 },
  { pattern: /\b(agustus|august|agu|agt|aug)\b/i, index: 7 },
  { pattern: /\b(september|sept|sep)\b/i, index: 8 },
  { pattern: /\b(oktober|october|okt|oct)\b/i, index: 9 },
  { pattern: /\b(november|nov)\b/i, index: 10 },
  { pattern: /\b(desember|december|des|dec)\b/i, index: 11 },
];

export type SelectedDateResult = {
  day: number;
  monthIndex: number; // 0 - 11
  year: number;
  dayName: string;
  monthName: string;
  shortMonth: string;
  displayDate: string; // "21 Nov 2026"
  fullDisplay: string; // "Sabtu, 21 Nov 2026"
  isoDate: string; // "2026-11-21"
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
  if (Number.isNaN(dateObj.getTime())) {
    return getDeviceNow();
  }

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

export function formatPeriodKeyToLabel(periodKeyOrLabel?: string): string {
  if (!periodKeyOrLabel) return getCurrentPeriodLabel();
  const match = periodKeyOrLabel.trim().match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIdx = parseInt(match[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
  }
  return periodKeyOrLabel;
}

export function parseIsoOrDisplayDate(input: string): SelectedDateResult {
  if (!input || typeof input !== 'string') return getDeviceNow();
  const trimmed = input.trim();
  if (!trimmed) return getDeviceNow();

  // 1. ISO YYYY-MM-DD or YYYY/MM/DD (with optional timestamp suffix)
  const isoMatch = trimmed.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return buildDateResult(y, m, d);
    }
  }

  // 1b. Indonesian receipt format DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const dmy4Match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.]((?:19|20)\d{2})/);
  if (dmy4Match) {
    const d = parseInt(dmy4Match[1], 10);
    const m = parseInt(dmy4Match[2], 10) - 1;
    const y = parseInt(dmy4Match[3], 10);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return buildDateResult(y, m, d);
    }
  }

  // 1c. 2-digit year Indonesian receipt format DD/MM/YY, DD-MM-YY, or DD.MM.YY
  const dmy2Match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?:\b|\s|$)/);
  if (dmy2Match) {
    const d = parseInt(dmy2Match[1], 10);
    const m = parseInt(dmy2Match[2], 10) - 1;
    const y = 2000 + parseInt(dmy2Match[3], 10);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return buildDateResult(y, m, d);
    }
  }

  // 2. Named month display strings: "27 Okt 2026", "Nov 20, 2026", "14 Agustus 2026", etc.
  const now = new Date();
  let monthIndex = now.getMonth();
  let matchedMonth = false;
  for (const alias of MONTH_ALIASES) {
    if (alias.pattern.test(trimmed)) {
      monthIndex = alias.index;
      matchedMonth = true;
      break;
    }
  }

  const yearMatch = trimmed.match(/\b((?:19|20)\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear();

  // Remove the matched 4-digit year before searching for day so year digits never collide
  const withoutYear = yearMatch ? trimmed.replace(yearMatch[0], ' ') : trimmed;
  const dayMatch = withoutYear.match(/\b(0?[1-9]|[12][0-9]|3[01])\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : now.getDate();

  if (!matchedMonth && !yearMatch && !dayMatch) {
    return getDeviceNow();
  }

  return buildDateResult(year, monthIndex, day);
}

export function getPeriodKeyFromDate(isoOrStringDate: string): string {
  const parsed = parseIsoOrDisplayDate(isoOrStringDate);
  return `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`;
}

export function isDateInCurrentPeriod(isoOrStringDate: string): boolean {
  return getPeriodKeyFromDate(isoOrStringDate) === getCurrentPeriodKey();
}

export function formatToDisplay(isoOrStringDate: string): string {
  const parsed = parseIsoOrDisplayDate(isoOrStringDate);
  return `${parsed.day} ${parsed.shortMonth} ${parsed.year}`;
}

export function compareDateStringsDesc(a: string, b: string): number {
  const isoA = parseIsoOrDisplayDate(a).isoDate;
  const isoB = parseIsoOrDisplayDate(b).isoDate;
  if (isoA === isoB) return 0;
  return isoA > isoB ? -1 : 1;
}
