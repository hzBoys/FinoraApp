import { Tx } from '../../models/types';

export type BudgetAllocationAnalysis = {
  totalIncome: number;
  totalExpense: number;
  totalKebutuhan: number;
  totalGayaHidup: number;
  totalTabungan: number;
  pctKebutuhan: number;
  pctGayaHidup: number;
  pctTabungan: number;
  recommendationText: string;
  lifestyleReductionNeeded: number;
};

/**
 * Analisis alokasi rasio anggaran (TC-04: Acuan 60% Kebutuhan, 20% Gaya Hidup, 20% Tabungan)
 */
export function analyzeSmartAdvisor(transactions: Tx[]): BudgetAllocationAnalysis {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalKebutuhan: 0,
      totalGayaHidup: 0,
      totalTabungan: 0,
      pctKebutuhan: 0,
      pctGayaHidup: 0,
      pctTabungan: 0,
      recommendationText:
        'Belum ada data transaksi. Catat transaksi pertama Anda atau pindai struk untuk mengaktifkan analisis finansial cerdas Finora.',
      lifestyleReductionNeeded: 0,
    };
  }

  const totalIncome = transactions
    .filter((t) => t.income)
    .reduce((s, t) => s + t.amount, 0);

  const kebutuhanExpenses = transactions
    .filter((t) => !t.income && ['Makan', 'Transportasi', 'Tagihan'].includes(t.cat))
    .reduce((s, t) => s + t.amount, 0);

  const gayaHidupExpenses = transactions
    .filter((t) => !t.income && ['Belanja', 'Hiburan'].includes(t.cat))
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = kebutuhanExpenses + gayaHidupExpenses;

  if (totalIncome === 0 && totalExpense === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalKebutuhan: 0,
      totalGayaHidup: 0,
      totalTabungan: 0,
      pctKebutuhan: 0,
      pctGayaHidup: 0,
      pctTabungan: 0,
      recommendationText:
        'Belum ada data transaksi tercatat. Mulai catat pengeluaran Anda untuk melihat rasio 60/20/20.',
      lifestyleReductionNeeded: 0,
    };
  }

  const baseIncome = totalIncome > 0 ? totalIncome : totalExpense;

  const pctKebutuhan = baseIncome > 0 ? Math.round((kebutuhanExpenses / baseIncome) * 100) : 0;
  const pctGayaHidup = baseIncome > 0 ? Math.round((gayaHidupExpenses / baseIncome) * 100) : 0;
  const pctTabungan = Math.max(0, 100 - (pctKebutuhan + pctGayaHidup));

  const targetGayaHidupMax = baseIncome * 0.2;
  const lifestyleReductionNeeded = Math.max(0, gayaHidupExpenses - targetGayaHidupMax);

  let recommendationText = 'Pola pengeluaran Anda seimbang dan memenuhi rasio ideal 60/20/20.';

  if (pctGayaHidup > 20) {
    recommendationText = `Pengeluaran gaya hidup mencapai ${pctGayaHidup}% (melewati batas 20%). Kurangi pengeluaran gaya hidup sebesar Rp${lifestyleReductionNeeded.toLocaleString(
      'id-ID'
    )} agar alokasi tabungan 20% tetap tercapai.`;
  } else if (pctKebutuhan > 60) {
    recommendationText = `Kebutuhan pokok menyerap ${pctKebutuhan}% pemasukan. Coba efisiensi anggaran belanja harian untuk menjaga stabilitas kas.`;
  }

  return {
    totalIncome,
    totalExpense,
    totalKebutuhan: kebutuhanExpenses,
    totalGayaHidup: gayaHidupExpenses,
    totalTabungan: Math.max(0, totalIncome - totalExpense),
    pctKebutuhan,
    pctGayaHidup,
    pctTabungan,
    recommendationText,
    lifestyleReductionNeeded,
  };
}
