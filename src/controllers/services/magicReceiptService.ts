import { getDeviceNow } from '../../utils/date';

export type OCRReceiptResult = {
  tanggal: string;
  nominal: number;
  merchant: string;
  metode_bayar: string;
  kategori: string;
  ringkasan_ocr?: string;
  processingTimeMs?: number;
  scanId?: string | null;
  fileUrl?: string | null;
};

export const MAX_FILE_SIZE_BYTES = 5000000; // 5 MB (SRS ER-1.1)

export function validateReceiptFile(
  fileSize: number,
  mimeTypeOrExt: string
): { valid: boolean; error?: string } {
  const normalized = mimeTypeOrExt.toLowerCase();
  const isValidFormat =
    normalized.includes('jpeg') ||
    normalized.includes('jpg') ||
    normalized.includes('png');

  if (!isValidFormat) {
    return { valid: false, error: 'Format file tidak didukung. Harap unggah format JPEG atau PNG.' };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Ukuran file melebihi batas maksimal 5 MB.' };
  }

  return { valid: true };
}

export function autoCategorizeMerchant(merchant: string, textSnippet: string = ''): string {
  const combined = `${merchant} ${textSnippet}`.toLowerCase();

  if (/makan|food|kopi|warung|resto|mie|bakso|gacoan|padang|kafe|cafe|bakery|roti|ayam|sate|warteg/i.test(combined)) {
    return 'Makan';
  }
  if (/bus|grab|gojek|transjakarta|krl|kereta|ojek|angkot|bensin|pertamina|shell|vivo|parkir|tol/i.test(combined)) {
    return 'Transportasi';
  }
  if (/bioskop|cinema|xxi|cgv|netflix|spotify|youtube|game|steam|konser|karaoke|hiburan/i.test(combined)) {
    return 'Hiburan';
  }
  if (/indomaret|alfamart|tokopedia|shopee|lazada|mall|supermarket|belanja|minimarket|hypermart|superindo/i.test(combined)) {
    return 'Belanja';
  }
  if (/pln|token|listrik|pdam|air|internet|wifi|indihome|biznet|pulsa|telkomsel|xl|indosat|bpjs|tagihan/i.test(combined)) {
    return 'Tagihan';
  }
  if (/gopay|ovo|dana|shopeepay|transfer|top up/i.test(combined)) {
    return 'Transfer';
  }

  return 'Belanja';
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
