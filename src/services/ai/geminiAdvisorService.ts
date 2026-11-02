import { BudgetAllocationAnalysis } from '../../controllers/services/smartAdvisorService';
import { executeGeminiJsonInteraction, isGeminiConfigured } from './geminiClient';

export type SmartAdvisorPromptContext = {
  periode: string;
  totalBudget: number;
  totalUsed: number;
  analysis: BudgetAllocationAnalysis;
  categorySpendings: { key: string; label: string; budget: number; used: number; pct: number }[];
};

export type SmartAdvisorAiOutput = {
  isi_saran: string;
  processingTimeMs: number;
  keyIndexUsed: number;
  modelUsed: string;
  usedFallback: boolean;
};

const ADVISOR_SYSTEM_INSTRUCTION = [
  'Anda adalah Finora Smart Advisor, asisten perencana keuangan pribadi Indonesia berbasis aturan alokasi ideal 60% Kebutuhan Pokok (Makan, Transportasi, Tagihan), 20% Gaya Hidup (Belanja, Hiburan), dan 20% Tabungan/Investasi (fitur SD-AI-02 / ER-3.1).',
  'PENTING: Seluruh angka Rupiah dan persentase SUDAH dihitung secara deterministik oleh sistem backend. JANGAN mengarang atau mengubah angka perhitungan tersebut.',
  'Tugas Anda menyusun saran finansial yang hangat, tajam, spesifik, dan langsung bisa ditindaklanjuti dalam Bahasa Indonesia (2 hingga 3 kalimat ringkas, maksimal 320 karakter).',
  'Aturan penulisan isi_saran:',
  '1. Sebutkan pos pengeluaran paling menonjol atau kondisi rasio 60/20/20 pengguna bulan ini.',
  '2. Jika lifestyleReductionNeeded > 0, WAJIB cantumkan angka pengurangan gaya hidup tersebut secara persis dalam format Rupiah (misal Rp250.000) agar target tabungan 20% tercapai.',
  '3. Jika rasio sudah sehat, berikan apresiasi singkat dan langkah konkret mengoptimalkan porsi tabungan/investasi.',
].join('\n');

const ADVISOR_SCHEMA = {
  type: 'object',
  properties: {
    isi_saran: {
      type: 'string',
      description: 'Rekomendasi keuangan personal 2-3 kalimat dalam Bahasa Indonesia.',
    },
  },
  required: ['isi_saran'],
};

type RawAdvisorSchemaPayload = {
  isi_saran: string;
};

export async function generateSmartAdvisorNarrative(
  ctx: SmartAdvisorPromptContext
): Promise<SmartAdvisorAiOutput> {
  const { analysis, totalBudget, totalUsed, periode, categorySpendings } = ctx;

  if (analysis.totalIncome === 0 && analysis.totalExpense === 0) {
    return {
      isi_saran: analysis.recommendationText,
      processingTimeMs: 0,
      keyIndexUsed: 0,
      modelUsed: 'deterministic-60-20-20',
      usedFallback: true,
    };
  }

  if (!isGeminiConfigured()) {
    return {
      isi_saran: analysis.recommendationText,
      processingTimeMs: 0,
      keyIndexUsed: 0,
      modelUsed: 'deterministic-60-20-20',
      usedFallback: true,
    };
  }

  const topCatsSummary = [...categorySpendings]
    .filter((c) => c.used > 0)
    .sort((a, b) => b.used - a.used)
    .slice(0, 3)
    .map(
      (c) =>
        `${c.label}: Rp${c.used.toLocaleString('id-ID')} dari limit Rp${c.budget.toLocaleString('id-ID')} (${c.pct}%)`
    )
    .join('; ');

  const deterministicPrompt = [
    `Periode: ${periode}`,
    `Pemasukan Bulan Ini: Rp${analysis.totalIncome.toLocaleString('id-ID')}`,
    `Total Pengeluaran Bulan Ini: Rp${analysis.totalExpense.toLocaleString('id-ID')}`,
    `Batas Anggaran Bulanan: Rp${totalBudget.toLocaleString('id-ID')} (Terpakai Rp${totalUsed.toLocaleString('id-ID')})`,
    `Rasio Aktual 60/20/20 -> Kebutuhan Pokok: ${analysis.pctKebutuhan}% (Rp${analysis.totalKebutuhan.toLocaleString('id-ID')}), Gaya Hidup: ${analysis.pctGayaHidup}% (Rp${analysis.totalGayaHidup.toLocaleString('id-ID')}), Sisa/Tabungan: ${analysis.pctTabungan}% (Rp${analysis.totalTabungan.toLocaleString('id-ID')})`,
    `Nominal Pengurangan Gaya Hidup yang Diperlukan (lifestyleReductionNeeded): Rp${analysis.lifestyleReductionNeeded.toLocaleString('id-ID')}`,
    `Kategori Pengeluaran Terbesar: ${topCatsSummary || 'Belum ada pengeluaran kategori'}`,
    'Susun isi_saran personal 2-3 kalimat berdasarkan data deterministik di atas.',
  ].join('\n');

  try {
    const interaction = await executeGeminiJsonInteraction<RawAdvisorSchemaPayload>({
      systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
      inputParts: [{ type: 'text', text: deterministicPrompt }],
      schema: ADVISOR_SCHEMA,
      temperature: 0.25,
    });

    const text = String(interaction.data?.isi_saran || '').trim();
    if (text.length < 20) {
      return {
        isi_saran: analysis.recommendationText,
        processingTimeMs: interaction.processingTimeMs,
        keyIndexUsed: interaction.keyIndexUsed,
        modelUsed: interaction.modelUsed,
        usedFallback: true,
      };
    }

    return {
      isi_saran: text,
      processingTimeMs: interaction.processingTimeMs,
      keyIndexUsed: interaction.keyIndexUsed,
      modelUsed: interaction.modelUsed,
      usedFallback: false,
    };
  } catch {
    return {
      isi_saran: analysis.recommendationText,
      processingTimeMs: 0,
      keyIndexUsed: 0,
      modelUsed: 'deterministic-60-20-20',
      usedFallback: true,
    };
  }
}
