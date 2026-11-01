/**
 * Format string or number into Indonesian thousand-separated string (e.g. "50000" -> "50.000")
 */
export function formatRupiahInput(value: string | number): string {
  if (value === null || value === undefined) return '';
  const cleanStr = String(value).replace(/[^0-9]/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

/**
 * Parse a formatted rupiah string into a pure integer number (e.g. "50.000" -> 50000)
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  const cleanStr = String(value).replace(/[^0-9]/g, '');
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}
