import { autoCategorizeMerchant, OCRReceiptResult } from '../../controllers/services/magicReceiptService';
import { formatToDisplay, getDeviceNow } from '../../utils/date';
import { cleanBase64String, normalizeImageMimeType } from '../db/storageService';
import {
  executeGeminiJsonInteraction,
  getConfiguredGeminiKeys,
  getConfiguredGeminiModel,
  isGeminiConfigured,
} from './geminiClient';

export { getConfiguredGeminiKeys, getConfiguredGeminiModel, isGeminiConfigured };

const VALID_EXPENSE_CATEGORIES = ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan'] as const;
const VALID_PAYMENT_PILLARS = ['Bank', 'E-Wallet', 'Investasi'] as const;

const RECEIPT_SYSTEM_INSTRUCTION = [
  'Anda adalah mesin OCR & ekstraksi dokumen keuangan presisi tinggi untuk aplikasi manajemen keuangan pribadi Indonesia bernama Finora.',
  'Tugas Anda membaca foto struk belanja fisik, bukti pembayaran QRIS, e-receipt minimarket/kafe/restoran, atau bukti transfer m-Banking/E-Wallet.',
  'Aturan ekstraksi:',
  '1. merchant: Nama toko, restoran, merchant QRIS, atau penyedia layanan (contoh: "Indomaret", "Kopi Kenangan", "PLN Prabayar").',
  '2. nominal: Ambil angka TOTAL AKHIR yang benar-benar dibayar dalam Rupiah bulat (integer tanpa desimal sen). Jangan tertukar dengan uang tunai diserahkan (CASH/TUNAI) atau kembalian (CHANGE/KEMBALI). Contoh: "Rp 45.500,00" -> 45500.',
  '3. tanggal: Tanggal transaksi pada struk dalam format YYYY-MM-DD. Jika tahun hanya 2 digit (mis. 02/11/26), konversi ke 2026-11-02. Jika tanggal tidak terbaca sama sekali, kembalikan string kosong "".',
  '4. metode_bayar: Petakan metode pembayaran ke salah satu dari 3 pilar Finora: "E-Wallet" (jika tertulis QRIS, GoPay, OVO, DANA, ShopeePay, LinkAja), "Investasi" (jika terkait Bibit, Bareksa, Ajaib, Reksadana, Saham), atau "Bank" (jika Debit, Kartu Kredit, BCA, Mandiri, BRI, BNI, Transfer, VA, atau metode lainnya).',
  '5. kategori: Pilih tepat satu kategori pengeluaran yang paling relevan dari daftar: "Makan", "Transportasi", "Belanja", "Tagihan", atau "Hiburan".',
  '6. ringkasan_ocr: Ringkasan singkat item atau teks inti yang terbaca pada struk (maksimal 200 karakter).',
  '7. is_valid_receipt: Bernilai true jika gambar adalah struk/bukti transaksi/tagihan/pembayaran yang memiliki informasi harga/nominal; false hanya jika gambar sama sekali bukan bukti transaksi.',
].join('\n');

const RECEIPT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    is_valid_receipt: {
      type: 'boolean',
      description: 'Apakah gambar merupakan struk atau bukti pembayaran yang valid.',
    },
    merchant: {
      type: 'string',
      description: 'Nama toko, merchant, atau tujuan pembayaran.',
    },
    nominal: {
      type: 'integer',
      description: 'Total nominal akhir pembayaran dalam Rupiah bulat.',
    },
    tanggal: {
      type: 'string',
      description: 'Tanggal transaksi dalam format YYYY-MM-DD atau string kosong jika tidak terlihat.',
    },
    metode_bayar: {
      type: 'string',
      enum: ['Bank', 'E-Wallet', 'Investasi'],
      description: 'Pilar akun pembayaran Finora yang sesuai.',
    },
    kategori: {
      type: 'string',
      enum: ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan'],
      description: 'Kategori pengeluaran otomatis.',
    },
    ringkasan_ocr: {
      type: 'string',
      description: 'Ringkasan teks atau daftar item utama dari struk.',
    },
  },
  required: [
    'is_valid_receipt',
    'merchant',
    'nominal',
    'tanggal',
    'metode_bayar',
    'kategori',
    'ringkasan_ocr',
  ],
};

function normalizePaymentPillar(rawMethod?: string, rawSummary?: string): 'Bank' | 'E-Wallet' | 'Investasi' {
  const combined = `${rawMethod || ''} ${rawSummary || ''}`.toLowerCase();
  if (/qris|gopay|ovo|dana|shopeepay|linkaja|e-wallet|ewallet/i.test(combined)) {
    return 'E-Wallet';
  }
  if (/bibit|bareksa|ajaib|investasi|reksadana|saham/i.test(combined)) {
    return 'Investasi';
  }
  if (VALID_PAYMENT_PILLARS.includes(rawMethod as any)) {
    return rawMethod as 'Bank' | 'E-Wallet' | 'Investasi';
  }
  return 'Bank';
}

function normalizeCategory(rawCat?: string, merchant?: string, summary?: string): string {
  if (rawCat && VALID_EXPENSE_CATEGORIES.includes(rawCat as any)) {
    return rawCat;
  }
  return autoCategorizeMerchant(merchant || '', summary || '');
}

export type GeminiReceiptExtractionOutput = OCRReceiptResult & {
  ringkasan_ocr: string;
  processingTimeMs: number;
  keyIndexUsed: number;
  totalKeysConfigured: number;
  modelUsed: string;
};

type RawReceiptSchemaPayload = {
  is_valid_receipt: boolean;
  merchant: string;
  nominal: number;
  tanggal: string;
  metode_bayar: string;
  kategori: string;
  ringkasan_ocr: string;
};

export async function extractReceiptWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiReceiptExtractionOutput> {
  const cleanBase64 = cleanBase64String(base64Image);
  const normalizedMime = normalizeImageMimeType(mimeType);
  const today = getDeviceNow();

  const interaction = await executeGeminiJsonInteraction<RawReceiptSchemaPayload>({
    systemInstruction: RECEIPT_SYSTEM_INSTRUCTION,
    inputParts: [
      {
        type: 'text',
        text: `Ekstrak data struk/bukti pembayaran ini ke JSON. Tanggal hari ini: ${today.isoDate}.`,
      },
      {
        type: 'image',
        data: cleanBase64,
        mime_type: normalizedMime,
      },
    ],
    schema: RECEIPT_EXTRACTION_SCHEMA,
    temperature: 0.1,
  });

  const parsed = interaction.data;

  if (parsed.is_valid_receipt === false && (!parsed.nominal || Number(parsed.nominal) <= 0)) {
    throw new Error(
      'Gambar tidak terdeteksi sebagai struk atau bukti pembayaran. Pastikan nominal pembayaran terlihat jelas.'
    );
  }

  const cleanMerchant = String(parsed.merchant || '').trim() || 'Struk Belanja';
  const rawNominal = Math.round(Math.abs(Number(parsed.nominal) || 0));
  if (rawNominal <= 0) {
    throw new Error(
      'Nominal pada struk belum terbaca dengan jelas. Coba gunakan foto yang lebih terang dan fokus.'
    );
  }

  const rawTanggal = String(parsed.tanggal || '').trim();
  const displayTanggal = rawTanggal ? formatToDisplay(rawTanggal) : today.displayDate;
  const ringkasanOcr = String(parsed.ringkasan_ocr || cleanMerchant).trim().slice(0, 500);
  const metodeBayar = normalizePaymentPillar(parsed.metode_bayar, ringkasanOcr);
  const kategori = normalizeCategory(parsed.kategori, cleanMerchant, ringkasanOcr);

  return {
    merchant: cleanMerchant,
    nominal: rawNominal,
    tanggal: displayTanggal,
    metode_bayar: metodeBayar,
    kategori,
    ringkasan_ocr: ringkasanOcr,
    processingTimeMs: interaction.processingTimeMs,
    keyIndexUsed: interaction.keyIndexUsed,
    totalKeysConfigured: interaction.totalKeysConfigured,
    modelUsed: interaction.modelUsed,
  };
}
