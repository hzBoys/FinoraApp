export type OCRReceiptResult = {
  tanggal: string;
  nominal: number;
  merchant: string;
  metode_bayar: string;
  kategori: string;
};

export const MAX_FILE_SIZE_BYTES = 5000000; // 5 MB

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

  if (/makan|food|kopi|warung|resto|mie|bakso|gacoan|padang|kafe/i.test(combined)) {
    return 'Makan';
  }
  if (/bus|grab|gojek|transjakarta|krl|kereta|ojek|angkot|bensin|pertamina|tol/i.test(combined)) {
    return 'Transportasi';
  }
  if (/bioskop|cinema|xxi|cgv|netflix|spotify|game|steam|konser/i.test(combined)) {
    return 'Hiburan';
  }
  if (/indomaret|alfamart|tokopedia|shopee|lazada|mall|supermarket|belanja|minimarket/i.test(combined)) {
    return 'Belanja';
  }
  if (/pln|token|listrik|pdam|air|internet|wifi|indihome|pulsa|bpjs/i.test(combined)) {
    return 'Tagihan';
  }
  if (/gopay|ovo|dana|shopeepay|transfer|top up/i.test(combined)) {
    return 'Transfer';
  }

  return 'Belanja';
}

export function extractMockReceipt(mockText?: string): OCRReceiptResult {
  // Simulasi ekstraksi OCR < 3 detik
  const merchant = mockText?.includes('Sembako') ? 'Toko Sembako Uji' : 'Resto Makan Siang';
  const kategori = autoCategorizeMerchant(merchant);

  return {
    tanggal: '18 Okt',
    nominal: 75000,
    merchant,
    metode_bayar: 'Tunai',
    kategori,
  };
}
