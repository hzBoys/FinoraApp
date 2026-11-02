import { AccountType } from '../../models/types';
import { cleanBase64String, normalizeImageMimeType } from '../db/storageService';
import { executeGeminiJsonInteraction } from './geminiClient';

export type OCRBalanceResult = {
  nama_akun: string;
  tipe: AccountType;
  saldo: number;
  ringkasan_ocr?: string;
  processingTimeMs?: number;
  scanId?: string | null;
  fileUrl?: string | null;
};

export type GeminiBalanceExtractionOutput = {
  nama_akun: string;
  tipe: AccountType;
  saldo: number;
  ringkasan_ocr: string;
  processingTimeMs: number;
  keyIndexUsed: number;
  totalKeysConfigured: number;
  modelUsed: string;
};

const PORTFOLIO_SYSTEM_INSTRUCTION = [
  'Anda adalah mesin OCR Auto-Portfolio presisi tinggi untuk aplikasi manajemen keuangan pribadi Indonesia bernama Finora (fitur ER-2.1).',
  'Tugas Anda membaca screenshot halaman utama / informasi saldo dari aplikasi m-Banking, E-Wallet, atau Investasi Indonesia.',
  'Aturan ekstraksi:',
  '1. nama_akun: Identifikasi nama penyedia akun secara ringkas dan baku, misalnya "BCA", "Mandiri", "BRI", "BNI", "BSI", "Bank Jago", "SeaBank", "GoPay", "OVO", "DANA", "ShopeePay", "LinkAja", "Bibit", "Bareksa", "Ajaib", "Stockbit", atau "Pluang". Jika merek spesifik tidak tertulis tetapi jelas rekening bank/dompet digital/investasi, gunakan label ringkas seperti "Bank", "E-Wallet", atau "Investasi".',
  '2. tipe: Klasifikasikan ke salah satu dari 3 pilar portofolio Finora: "bank" (rekening tabungan/m-banking), "ewallet" (dompet digital/uang elektronik), atau "investasi" (reksadana, saham, emas, SBN, kripto).',
  '3. saldo: Ambil angka SALDO UTAMA / NILAI PORTOFOLIO AKTIF dalam Rupiah bulat (integer tanpa desimal sen). Contoh: "Rp 2.450.000,00" -> 2450000. Jangan tertukar dengan nomor rekening, nomor HP, poin rewards/coins, atau riwayat mutasi kecil.',
  '4. ringkasan_ocr: Ringkasan singkat teks yang terbaca pada screenshot saldo (maksimal 200 karakter).',
  '5. is_valid_balance: Bernilai true jika gambar menampilkan informasi saldo akun/rekening/dompet digital/portofolio investasi; false jika gambar sama sekali bukan tampilan saldo keuangan.',
].join('\n');

const BALANCE_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    is_valid_balance: {
      type: 'boolean',
      description: 'Apakah gambar merupakan screenshot saldo akun keuangan yang valid.',
    },
    nama_akun: {
      type: 'string',
      description: 'Nama akun bank, e-wallet, atau platform investasi (contoh: BCA, GoPay, Bibit).',
    },
    tipe: {
      type: 'string',
      enum: ['bank', 'ewallet', 'investasi'],
      description: 'Pilar tipe akun portofolio Finora.',
    },
    saldo: {
      type: 'integer',
      description: 'Nominal saldo aktif atau nilai portofolio dalam Rupiah bulat.',
    },
    ringkasan_ocr: {
      type: 'string',
      description: 'Ringkasan teks utama yang terdeteksi dari screenshot saldo.',
    },
  },
  required: ['is_valid_balance', 'nama_akun', 'tipe', 'saldo', 'ringkasan_ocr'],
};

type RawBalanceSchemaPayload = {
  is_valid_balance: boolean;
  nama_akun: string;
  tipe: string;
  saldo: number;
  ringkasan_ocr: string;
};

function normalizeAccountType(rawTipe?: string, namaAkun?: string, summary?: string): AccountType {
  const combined = `${rawTipe || ''} ${namaAkun || ''} ${summary || ''}`.toLowerCase();
  if (/gopay|ovo|dana|shopeepay|linkaja|isaku|doku|sakuku|ewallet|e-wallet|dompet/i.test(combined)) {
    return 'ewallet';
  }
  if (/bibit|bareksa|ajaib|stockbit|pluang|ipot|reksadana|saham|investasi|portofolio|emas/i.test(combined)) {
    return 'investasi';
  }
  if (rawTipe === 'ewallet' || rawTipe === 'investasi' || rawTipe === 'bank') {
    return rawTipe;
  }
  return 'bank';
}

function normalizeAccountName(rawName?: string, tipe?: AccountType): string {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) {
    return tipe === 'ewallet' ? 'E-Wallet' : tipe === 'investasi' ? 'Investasi' : 'Bank';
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('bca') || lower.includes('mybca')) return 'BCA';
  if (lower.includes('mandiri') || lower.includes('livin')) return 'Mandiri';
  if (lower.includes('bri') || lower.includes('brimo')) return 'BRI';
  if (lower.includes('bni') || lower.includes('wondr')) return 'BNI';
  if (lower.includes('bsi')) return 'BSI';
  if (lower.includes('jago')) return 'Bank Jago';
  if (lower.includes('seabank')) return 'SeaBank';
  if (lower.includes('gopay')) return 'GoPay';
  if (lower.includes('ovo')) return 'OVO';
  if (lower.includes('dana')) return 'DANA';
  if (lower.includes('shopeepay')) return 'ShopeePay';
  if (lower.includes('linkaja')) return 'LinkAja';
  if (lower.includes('bibit')) return 'Bibit';
  if (lower.includes('bareksa')) return 'Bareksa';
  if (lower.includes('ajaib')) return 'Ajaib';
  if (lower.includes('stockbit')) return 'Stockbit';
  if (lower.includes('pluang')) return 'Pluang';

  return trimmed.slice(0, 40);
}

export async function extractBalanceWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiBalanceExtractionOutput> {
  const cleanBase64 = cleanBase64String(base64Image);
  const normalizedMime = normalizeImageMimeType(mimeType);

  const interaction = await executeGeminiJsonInteraction<RawBalanceSchemaPayload>({
    systemInstruction: PORTFOLIO_SYSTEM_INSTRUCTION,
    inputParts: [
      {
        type: 'text',
        text: 'Ekstrak nama akun, tipe pilar (bank/ewallet/investasi), dan nominal saldo Rupiah dari screenshot aplikasi keuangan ini.',
      },
      {
        type: 'image',
        data: cleanBase64,
        mime_type: normalizedMime,
      },
    ],
    schema: BALANCE_EXTRACTION_SCHEMA,
    temperature: 0.1,
  });

  const parsed = interaction.data;

  if (parsed.is_valid_balance === false) {
    throw new Error(
      'Gambar tidak terdeteksi sebagai screenshot saldo m-Banking, E-Wallet, atau Investasi. Pastikan nominal saldo terlihat jelas.'
    );
  }

  const rawSaldo = Math.round(Number(parsed.saldo));
  if (!Number.isFinite(rawSaldo) || rawSaldo < 0) {
    throw new Error(
      'Nominal saldo pada screenshot belum terbaca dengan jelas. Pastikan angka saldo utama tidak tertutup sensor.'
    );
  }

  const ringkasanOcr = String(parsed.ringkasan_ocr || parsed.nama_akun || 'Scan Saldo').trim().slice(0, 500);
  const normalizedTipe = normalizeAccountType(parsed.tipe, parsed.nama_akun, ringkasanOcr);
  const normalizedName = normalizeAccountName(parsed.nama_akun, normalizedTipe);

  return {
    nama_akun: normalizedName,
    tipe: normalizedTipe,
    saldo: rawSaldo,
    ringkasan_ocr: ringkasanOcr,
    processingTimeMs: interaction.processingTimeMs,
    keyIndexUsed: interaction.keyIndexUsed,
    totalKeysConfigured: interaction.totalKeysConfigured,
    modelUsed: interaction.modelUsed,
  };
}
