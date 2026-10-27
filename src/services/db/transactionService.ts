import { supabase } from '../supabase';
import { Tx } from '../../models/types';

const CATEGORY_NAME_TO_ID: Record<string, number> = {
  Makan: 1,
  Transportasi: 2,
  Tagihan: 3,
  Belanja: 4,
  Hiburan: 5,
  Pemasukan: 6,
  Transfer: 7,
};

const MONTH_NAME_TO_NUMBER: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  mei: '05',
  jun: '06',
  jul: '07',
  agu: '08',
  sep: '09',
  okt: '10',
  nov: '11',
  des: '12',
};

function formatIsoDate(dateInput: string): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  const clean = dateInput.toLowerCase();
  const dayMatch = clean.match(/\b([1-9]|[12][0-9]|3[01])\b/);
  const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';

  let month = '10';
  for (const [mName, mNum] of Object.entries(MONTH_NAME_TO_NUMBER)) {
    if (clean.includes(mName)) {
      month = mNum;
      break;
    }
  }

  const yearMatch = clean.match(/\b(20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '27 Okt';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${day} ${months[monthIdx] || 'Okt'}`;
  }
  return isoDate;
}

export const transactionService = {
  async fetchTransactions(userId: string): Promise<Tx[] | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          nama,
          nominal,
          jenis,
          tanggal,
          merchant,
          metode_bayar,
          account_id,
          category_id,
          categories (
            nama_kategori
          )
        `)
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) {
        console.warn('transactionService.fetchTransactions warning:', error.message);
        return null;
      }

      if (!data) return null;
      if (data.length === 0) return [];

      return data.map((item: any) => {
        const catName =
          item.categories?.nama_kategori || (item.jenis === 'masuk' ? 'Pemasukan' : 'Belanja');
        return {
          id: item.id,
          name: item.nama,
          date: formatDisplayDate(item.tanggal),
          cat: catName,
          amount: Number(item.nominal),
          income: item.jenis === 'masuk',
          account_id: item.account_id,
          merchant: item.merchant,
          metode_bayar: item.metode_bayar,
        };
      });
    } catch (err) {
      console.warn('transactionService.fetchTransactions exception:', err);
      return null;
    }
  },

  async createTransaction(userId: string, tx: Tx): Promise<string | null> {
    try {
      const categoryId = CATEGORY_NAME_TO_ID[tx.cat] || (tx.income ? 6 : 4);
      const isoDate = formatIsoDate(tx.date);

      const payload: any = {
        user_id: userId,
        nama: tx.name,
        nominal: tx.amount,
        jenis: tx.income ? 'masuk' : 'keluar',
        tanggal: isoDate,
        category_id: categoryId,
        merchant: tx.merchant || tx.name,
        metode_bayar: tx.metode_bayar || 'Bank',
      };

      if (tx.account_id && typeof tx.account_id === 'string' && tx.account_id.includes('-')) {
        payload.account_id = tx.account_id;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.warn('transactionService.createTransaction warning:', error.message);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.warn('transactionService.createTransaction exception:', err);
      return null;
    }
  },

  async deleteTransaction(txId: string | number): Promise<boolean> {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', txId);
      if (error) {
        console.warn('transactionService.deleteTransaction warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('transactionService.deleteTransaction exception:', err);
      return false;
    }
  },
};
