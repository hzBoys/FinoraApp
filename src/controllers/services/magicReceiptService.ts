import { getDeviceNow } from '../../utils/date';

export type OCRReceiptResult = {
  tanggal: string;
  nominal: number;
  merchant: string;
  metode_bayar: string;
  kategori: string;
  detectedAccountHint?: string;
  ringkasan_ocr?: string;
  processingTimeMs?: number;
  scanId?: string | null;
  fileUrl?: string | null;
};

export const MAX_FILE_SIZE_BYTES = 5000000; // 5 MB (SRS ER-1.1 / TC-01)

export const CANONICAL_CATEGORIES = [
  'Makan',
  'Transportasi',
  'Tagihan',
  'Belanja',
  'Hiburan',
  'Pemasukan',
  'Transfer',
] as const;

export function normalizeCategoryName(rawCategory?: string | null, isIncome = false): string {
  const key = (rawCategory || '').trim().toLowerCase();
  if (!key) return isIncome ? 'Pemasukan' : 'Belanja';

  if (key === 'makan' || key === 'makanan' || key === 'makan & minum' || key === 'makanan & minuman' || key.includes('food') || key.includes('kuliner') || key.includes('minum')) {
    return 'Makan';
  }
  if (key === 'transportasi' || key.includes('transport') || key.includes('ojek') || key.includes('bensin') || key.includes('parkir')) {
    return 'Transportasi';
  }
  if (key === 'tagihan' || key.includes('bill') || key.includes('listrik') || key.includes('utilitas') || key.includes('internet') || key.includes('pulsa')) {
    return 'Tagihan';
  }
  if (key === 'hiburan' || key.includes('entertain') || key.includes('bioskop') || key.includes('game') || key.includes('streaming')) {
    return 'Hiburan';
  }
  if (key === 'belanja' || key.includes('shop') || key.includes('grocer') || key.includes('minimarket') || key.includes('sembako')) {
    return 'Belanja';
  }
  if (key === 'pemasukan' || key.includes('income') || key.includes('gaji') || key.includes('salary')) {
    return 'Pemasukan';
  }
  if (key === 'transfer' || key.includes('top up') || key.includes('topup') || key.includes('mutasi')) {
    return 'Transfer';
  }

  return isIncome ? 'Pemasukan' : 'Belanja';
}

export function validateReceiptFile(
  fileSize: number,
  mimeTypeOrExt: string
): { valid: boolean; error?: string } {
  const normalized = (mimeTypeOrExt || '').toLowerCase();
  const isValidFormat =
    normalized.includes('jpeg') ||
    normalized.includes('jpg') ||
    normalized.includes('png');

  if (!isValidFormat) {
    return { valid: false, error: 'Format file tidak didukung. Harap unggah format JPEG atau PNG.' };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file melebihi batas 5 MB. Harap gunakan foto dengan resolusi lebih ringkas atau potret lebih dekat.',
    };
  }

  return { valid: true };
}

export function autoCategorizeMerchant(merchant: string, textSnippet: string = ''): string {
  const combined = `${merchant} ${textSnippet}`.toLowerCase();

  if (/makan|food|kopi|warung|resto|mie|bakso|gacoan|padang|kafe|cafe|bakery|roti|ayam|sate|warteg|starbucks|fore|janji jiwa|kenangan|chatime|mixue|mcd|kfc|hokben|solaria|richeese/i.test(combined)) {
    return 'Makan';
  }
  if (/bus|grab|gojek|transjakarta|krl|kereta|ojek|angkot|bensin|pertamina|shell|vivo|parkir|tol|kai|whoosh|mrt|lrt|bluebird/i.test(combined)) {
    return 'Transportasi';
  }
  if (/bioskop|cinema|xxi|cgv|cinepolis|netflix|spotify|youtube|game|steam|playstation|xbox|konser|karaoke|hiburan/i.test(combined)) {
    return 'Hiburan';
  }
  if (/indomaret|alfamart|alfamidi|tokopedia|shopee|lazada|blibli|mall|supermarket|belanja|minimarket|hypermart|superindo|lottemart|uniqlo|guardian|watson|sembako/i.test(combined)) {
    return 'Belanja';
  }
  if (/pln|token|listrik|pdam|air|internet|wifi|indihome|biznet|firstmedia|pulsa|telkomsel|xl|indosat|tri|smartfren|bpjs|tagihan|pascabayar/i.test(combined)) {
    return 'Tagihan';
  }
  if (/transfer|top up|topup/i.test(combined)) {
    return 'Transfer';
  }

  return 'Belanja';
}

export function detectAccountBrandHint(text: string): string | undefined {
  const lower = (text || '').toLowerCase();
  const brands: { pattern: RegExp; label: string }[] = [
    { pattern: /\bgopay\b/, label: 'GoPay' },
    { pattern: /\bovo\b/, label: 'OVO' },
    { pattern: /\bdana\b/, label: 'DANA' },
    { pattern: /\bshopeepay\b/, label: 'ShopeePay' },
    { pattern: /\blinkaja\b/, label: 'LinkAja' },
    { pattern: /\b(bca|mybca|flazz)\b/, label: 'BCA' },
    { pattern: /\b(mandiri|livin)\b/, label: 'Mandiri' },
    { pattern: /\b(bri|brimo)\b/, label: 'BRI' },
    { pattern: /\b(bni|wondr)\b/, label: 'BNI' },
    { pattern: /\bbsi\b/, label: 'BSI' },
    { pattern: /\bjago\b/, label: 'Bank Jago' },
    { pattern: /\bseabank\b/, label: 'SeaBank' },
    { pattern: /\bbibit\b/, label: 'Bibit' },
    { pattern: /\bajaib\b/, label: 'Ajaib' },
    { pattern: /\bbareksa\b/, label: 'Bareksa' },
    { pattern: /\bstockbit\b/, label: 'Stockbit' },
  ];

  for (const item of brands) {
    if (item.pattern.test(lower)) {
      return item.label;
    }
  }
  return undefined;
}

export function extractMockReceipt(mockText?: string): OCRReceiptResult {
  const merchant = mockText?.includes('Sembako') ? 'Toko Sembako Uji' : 'Resto Makan Siang';
  const kategori = autoCategorizeMerchant(merchant);

  return {
    tanggal: getDeviceNow().displayDate,
    nominal: 75000,
    merchant,
    metode_bayar: 'Bank',
    kategori,
  };
}
