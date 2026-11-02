import { supabase } from '../supabase';
import { Tx } from '../../models/types';
import { formatToDisplay, parseIsoOrDisplayDate } from '../../utils/date';

const FALLBACK_CATEGORY_NAME_TO_ID: Record<string, number> = {
  makan: 1,
  transportasi: 2,
  tagihan: 3,
  belanja: 4,
  hiburan: 5,
  pemasukan: 6,
  transfer: 7,
};

let cachedCategoryMap: Record<string, number> | null = null;

async function resolveCategoryId(catName: string, isIncome: boolean): Promise<number> {
  if (!cachedCategoryMap) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, nama_kategori');

      if (!error && data && data.length > 0) {
        const map: Record<string, number> = { ...FALLBACK_CATEGORY_NAME_TO_ID };
        data.forEach((row: { id: number; nama_kategori: string }) => {
          if (row.nama_kategori) {
            map[row.nama_kategori.trim().toLowerCase()] = Number(row.id);
          }
        });
        cachedCategoryMap = map;
      }
    } catch {
      // Keep fallback map if offline
    }
  }

  const lookup = cachedCategoryMap || FALLBACK_CATEGORY_NAME_TO_ID;
  const key = (catName || '').trim().toLowerCase();
  return lookup[key] ?? (isIncome ? lookup.pemasukan ?? 6 : lookup.belanja ?? 4);
}

export type AtomicCreateTxResult = {
  transactionId: string | null;
  accountId: string | null;
  newBalance: number | null;
  usedAtomicRpc: boolean;
};

export type AtomicDeleteTxResult = {
  deleted: boolean;
  accountId: string | null;
  newBalance: number | null;
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
          catatan,
          account_id,
          category_id,
          categories (
            nama_kategori
          )
        `)
        .eq('user_id', userId)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('transactionService.fetchTransactions warning:', error.message);
        return null;
      }

      if (!data) return null;
      if (data.length === 0) return [];

      return data.map((item: any) => {
        const catObj = Array.isArray(item.categories) ? item.categories[0] : item.categories;
        const catName =
          catObj?.nama_kategori || (item.jenis === 'masuk' ? 'Pemasukan' : 'Belanja');
        return {
          id: item.id,
          name: item.nama,
          date: formatToDisplay(item.tanggal),
          cat: catName,
          amount: Number(item.nominal),
          income: item.jenis === 'masuk',
          account_id: item.account_id ?? undefined,
          merchant: item.merchant ?? undefined,
          metode_bayar: item.metode_bayar ?? undefined,
          catatan: item.catatan ?? undefined,
        };
      });
    } catch (err) {
      console.warn('transactionService.fetchTransactions exception:', err);
      return null;
    }
  },

  async createTransactionAtomic(userId: string, tx: Tx): Promise<AtomicCreateTxResult> {
    const parsedDate = parseIsoOrDisplayDate(tx.date);
    const validAccountUuid =
      tx.account_id && typeof tx.account_id === 'string' && tx.account_id.includes('-')
        ? tx.account_id
        : null;

    try {
      const { data, error } = await supabase.rpc('create_transaction_atomic', {
        p_nama: tx.name,
        p_nominal: tx.amount,
        p_jenis: tx.income ? 'masuk' : 'keluar',
        p_tanggal: parsedDate.isoDate,
        p_category_name: tx.cat,
        p_account_id: validAccountUuid,
        p_merchant: tx.merchant || tx.name,
        p_metode_bayar: tx.metode_bayar || 'Bank',
        p_catatan: tx.catatan || null,
      });

      if (!error && data) {
        return {
          transactionId: data.transaction_id ?? null,
          accountId: data.account_id ?? validAccountUuid,
          newBalance:
            data.new_balance !== null && data.new_balance !== undefined
              ? Number(data.new_balance)
              : null,
          usedAtomicRpc: true,
        };
      }

      if (error) {
        console.warn('transactionService.createTransactionAtomic RPC warning:', error.message);
      }
    } catch (err) {
      console.warn('transactionService.createTransactionAtomic RPC exception:', err);
    }

    // Graceful fallback if RPC is unavailable
    const fallbackId = await this.createTransaction(userId, tx);
    return {
      transactionId: fallbackId,
      accountId: validAccountUuid,
      newBalance: null,
      usedAtomicRpc: false,
    };
  },

  async createTransaction(userId: string, tx: Tx): Promise<string | null> {
    try {
      const categoryId = await resolveCategoryId(tx.cat, tx.income);
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

      if (tx.catatan) {
        payload.catatan = tx.catatan;
      }

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

  async deleteTransactionAtomic(txId: string | number): Promise<AtomicDeleteTxResult> {
    if (typeof txId === 'string' && txId.includes('-')) {
      try {
        const { data, error } = await supabase.rpc('delete_transaction_atomic', {
          p_transaction_id: txId,
        });

        if (!error && data) {
          return {
            deleted: Boolean(data.deleted),
            accountId: data.account_id ?? null,
            newBalance:
              data.new_balance !== null && data.new_balance !== undefined
                ? Number(data.new_balance)
                : null,
          };
        }

        if (error) {
          console.warn('transactionService.deleteTransactionAtomic RPC warning:', error.message);
        }
      } catch (err) {
        console.warn('transactionService.deleteTransactionAtomic exception:', err);
      }
    }

    const ok = await this.deleteTransaction(txId);
    return { deleted: ok, accountId: null, newBalance: null };
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
