import { supabase } from '../supabase';
import { Tx } from '../../models/types';
import { formatToDisplay, parseIsoOrDisplayDate } from '../../utils/date';

const CATEGORY_NAME_TO_ID: Record<string, number> = {
  Makan: 1,
  Transportasi: 2,
  Tagihan: 3,
  Belanja: 4,
  Hiburan: 5,
  Pemasukan: 6,
  Transfer: 7,
};

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
          date: formatToDisplay(item.tanggal),
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
      const parsedDate = parseIsoOrDisplayDate(tx.date);

      const payload: any = {
        user_id: userId,
        nama: tx.name,
        nominal: tx.amount,
        jenis: tx.income ? 'masuk' : 'keluar',
        tanggal: parsedDate.isoDate,
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
