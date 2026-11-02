import { autoCategorizeMerchant, OCRReceiptResult } from '../../controllers/services/magicReceiptService';
import { formatToDisplay, getDeviceNow } from '../../utils/date';
import { cleanBase64String, normalizeImageMimeType } from '../db/storageService';

const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_API_REVISION = '2026-05-20';
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

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

// Module-level Round-Robin pointer & per-key temporary rate-limit cooldown tracker
let roundRobinCursor = 0;
const keyCooldownUntilMs = new Map<number, number>();

export function getConfiguredGeminiKeys(): string[] {
  const raw =
    process.env.EXPO_PUBLIC_GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEYS ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  return String(raw)
    .split(',')
    .map((k: string) => k.trim().replace(/^['"]|['"]$/g, ''))
    .filter((k: string) => k.length > 0);
}

export function getConfiguredGeminiModel(): string {
  const raw =
    process.env.EXPO_PUBLIC_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    DEFAULT_GEMINI_MODEL;
  return raw.trim() || DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured(): boolean {
  return getConfiguredGeminiKeys().length > 0;
}

function buildRoundRobinKeyOrder(totalKeys: number): number[] {
  if (totalKeys <= 0) return [];
  const start = roundRobinCursor % totalKeys;
  // Advance pointer immediately so the next request starts on the next key
  roundRobinCursor = (start + 1) % totalKeys;

  const now = Date.now();
  const ready: number[] = [];
  const coolingDown: number[] = [];

  for (let offset = 0; offset < totalKeys; offset++) {
    const idx = (start + offset) % totalKeys;
    const blockedUntil = keyCooldownUntilMs.get(idx) ?? 0;
    if (blockedUntil > now) {
      coolingDown.push(idx);
    } else {
      ready.push(idx);
    }
  }

  return [...ready, ...coolingDown];
}

function extractTextFromInteractionResponse(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload?.steps)) {
    for (let i = payload.steps.length - 1; i >= 0; i--) {
      const step = payload.steps[i];
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const joined = step.content
          .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
          .map((part: any) => part.text)
          .join('')
          .trim();
        if (joined.length > 0) {
          return joined;
        }
      }
    }
  }

  const fallbackCandidateText = payload?.candidates?.[0]?.content?.parts
    ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim();

  return fallbackCandidateText || '';
}

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

export async function extractReceiptWithGemini(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiReceiptExtractionOutput> {
  const keys = getConfiguredGeminiKeys();
  if (keys.length === 0) {
    throw new Error('API Key Gemini belum dikonfigurasi pada file .env (EXPO_PUBLIC_GEMINI_API_KEYS).');
  }

  const model = getConfiguredGeminiModel();
  const cleanBase64 = cleanBase64String(base64Image);
  const normalizedMime = normalizeImageMimeType(mimeType);
  const today = getDeviceNow();
  const keyOrder = buildRoundRobinKeyOrder(keys.length);

  const startedAt = Date.now();
  let lastErrorMessage = 'Gagal terhubung ke layanan Gemini AI.';

  for (const keyIdx of keyOrder) {
    const apiKey = keys[keyIdx];
    try {
      const response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Revision': GEMINI_API_REVISION,
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          store: false,
          system_instruction: RECEIPT_SYSTEM_INSTRUCTION,
          input: [
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
          generation_config: {
            thinking_level: 'minimal',
            temperature: 0.1,
          },
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: RECEIPT_EXTRACTION_SCHEMA,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        // Rate limit or server overload -> cooldown this key and failover to next key in Round-Robin
        if (response.status === 429 || response.status === 503 || response.status === 500) {
          keyCooldownUntilMs.set(keyIdx, Date.now() + 60_000);
          lastErrorMessage = `Kuota API Key #${keyIdx + 1} penuh (HTTP ${response.status}), mencoba key berikutnya...`;
          continue;
        }
        if (response.status === 401 || response.status === 403) {
          keyCooldownUntilMs.set(keyIdx, Date.now() + 300_000);
          lastErrorMessage = `API Key #${keyIdx + 1} tidak diizinkan (HTTP ${response.status}).`;
          continue;
        }
        throw new Error(`Permintaan OCR ditolak (HTTP ${response.status}): ${errBody.slice(0, 140)}`);
      }

      const rawJson = await response.json();
      const jsonText = extractTextFromInteractionResponse(rawJson);
      if (!jsonText) {
        lastErrorMessage = 'Respons AI kosong, mencoba ulang...';
        continue;
      }

      const parsed = JSON.parse(jsonText);
      const processingTimeMs = Date.now() - startedAt;

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
        processingTimeMs,
        keyIndexUsed: keyIdx + 1,
        totalKeysConfigured: keys.length,
        modelUsed: model,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      // Immediately surface user-facing validation errors (not network/quota failures)
      if (
        msg.includes('Gambar tidak terdeteksi') ||
        msg.includes('Nominal pada struk') ||
        msg.includes('Permintaan OCR ditolak')
      ) {
        throw err;
      }
      lastErrorMessage = msg;
    }
  }

  throw new Error(lastErrorMessage);
}
