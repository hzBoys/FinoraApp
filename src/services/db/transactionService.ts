import { supabase } from '../supabase';
import { Tx } from '../../models/types';
import { formatToDisplay, parseIsoOrDisplayDate } from '../../utils/date';
import { normalizeCategoryName } from '../../controllers/services/magicReceiptService';

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
  const canonical = normalizeCategoryName(catName, isIncome).toLowerCase();
  const rawKey = (catName || '').trim().toLowerCase();
  return lookup[canonical] ?? lookup[rawKey] ?? (isIncome ? lookup.pemasukan ?? 6 : lookup.belanja ?? 4);
}

export type AtomicCreateTxResult = {
  transactionId: string | null;
  accountId: string | null;
  newBalance: number | null;
  usedAtomicRpc: boolean;
  error?: string;
};

export type AtomicUpdateTxResult = {
  updated: boolean;
  transactionId: string | null;
  oldAccountId: string | null;
  oldAccountBalance: number | null;
  newAccountId: string | null;
  newAccountBalance: number | null;
  usedAtomicRpc: boolean;
  error?: string;
};

export type AtomicDeleteTxResult = {
  deleted: boolean;
  accountId: string | null;
  newBalance: number | null;
  error?: string;
};

export type DashboardSummaryRpcResult = {
  periode: string;
  total_balance: number;
  bank_balance: number;
  ewallet_balance: number;
  investasi_balance: number;
  account_count: number;
  monthly_income: number;
  monthly_expense: number;
  transaction_count: number;
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
        const isIncome = item.jenis === 'masuk';
        const catName = normalizeCategoryName(catObj?.nama_kategori, isIncome);
        return {
          id: item.id,
          name: item.nama,
          date: formatToDisplay(item.tanggal),
          cat: catName,
          amount: Number(item.nominal),
          income: isIncome,
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

  async createTransactionAtomic(
    userId: string,
    tx: Tx,
    scanId?: string | null
  ): Promise<AtomicCreateTxResult> {
    const parsedDate = parseIsoOrDisplayDate(tx.date);
    const canonicalCat = normalizeCategoryName(tx.cat, tx.income);
    const validAccountUuid =
      tx.account_id && typeof tx.account_id === 'string' && tx.account_id.includes('-')
        ? tx.account_id
        : null;
    const validScanUuid =
      scanId && typeof scanId === 'string' && scanId.includes('-') ? scanId : null;

    const baseRpcParams: Record<string, unknown> = {
      p_nama: tx.name,
      p_nominal: tx.amount,
      p_jenis: tx.income ? 'masuk' : 'keluar',
      p_tanggal: parsedDate.isoDate,
      p_category_name: canonicalCat,
      p_account_id: validAccountUuid,
      p_merchant: tx.merchant || tx.name,
      p_metode_bayar: tx.metode_bayar || 'Bank',
      p_catatan: tx.catatan || null,
    };

    let rpcErrorMsg: string | undefined;

    try {
      // Try Phase 3 signature (with atomic p_scan_id linking) first when scanId is provided
      let rpcCall = validScanUuid
        ? await supabase.rpc('create_transaction_atomic', {
            ...baseRpcParams,
            p_scan_id: validScanUuid,
          })
        : await supabase.rpc('create_transaction_atomic', baseRpcParams);

      // Backward compatibility: if DB still has Phase 1 signature without p_scan_id, retry cleanly
      if (
        validScanUuid &&
        rpcCall.error &&
        /function|parameter|p_scan_id|schema cache/i.test(rpcCall.error.message || '')
      ) {
        rpcCall = await supabase.rpc('create_transaction_atomic', baseRpcParams);
      }

      if (!rpcCall.error && rpcCall.data) {
        return {
          transactionId: rpcCall.data.transaction_id ?? null,
          accountId: rpcCall.data.account_id ?? validAccountUuid,
          newBalance:
            rpcCall.data.new_balance !== null && rpcCall.data.new_balance !== undefined
              ? Number(rpcCall.data.new_balance)
              : null,
          usedAtomicRpc: true,
        };
      }

      if (rpcCall.error) {
        rpcErrorMsg = rpcCall.error.message;
        console.warn('transactionService.createTransactionAtomic RPC warning:', rpcCall.error.message);
      }
    } catch (err: any) {
      rpcErrorMsg = err?.message || String(err);
      console.warn('transactionService.createTransactionAtomic RPC exception:', err);
    }

    // Graceful fallback if RPC is unavailable
    const fallback = await this.createTransaction(userId, { ...tx, cat: canonicalCat });
    return {
      transactionId: fallback.id,
      accountId: validAccountUuid,
      newBalance: null,
      usedAtomicRpc: false,
      error: fallback.id ? undefined : fallback.error || rpcErrorMsg || 'Gagal menyimpan transaksi ke server.',
    };
  },

  async createTransaction(userId: string, tx: Tx): Promise<{ id: string | null; error?: string }> {
    try {
      const canonicalCat = normalizeCategoryName(tx.cat, tx.income);
      const categoryId = await resolveCategoryId(canonicalCat, tx.income);
      const parsedDate = parseIsoOrDisplayDate(tx.date);

      const payload: Record<string, unknown> = {
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
        return { id: null, error: error.message };
      }

      return { id: data?.id || null };
    } catch (err: any) {
      console.warn('transactionService.createTransaction exception:', err);
      return { id: null, error: err?.message || 'Gagal terhubung ke database.' };
    }
  },

  async updateTransactionAtomic(
    userId: string,
    txId: string | number,
    tx: Tx
  ): Promise<AtomicUpdateTxResult> {
    const canonicalCat = normalizeCategoryName(tx.cat, tx.income);
    const parsedDate = parseIsoOrDisplayDate(tx.date);
    const validAccountUuid =
      tx.account_id && typeof tx.account_id === 'string' && tx.account_id.includes('-')
        ? tx.account_id
        : null;

    if (typeof txId === 'string' && txId.includes('-')) {
      try {
        const { data, error } = await supabase.rpc('update_transaction_atomic', {
          p_transaction_id: txId,
          p_nama: tx.name,
          p_nominal: tx.amount,
          p_jenis: tx.income ? 'masuk' : 'keluar',
          p_tanggal: parsedDate.isoDate,
          p_category_name: canonicalCat,
          p_account_id: validAccountUuid,
          p_merchant: tx.merchant || tx.name,
          p_metode_bayar: tx.metode_bayar || 'Bank',
          p_catatan: tx.catatan || null,
        });

        if (!error && data) {
          return {
            updated: true,
            transactionId: data.transaction_id ?? txId,
            oldAccountId: data.old_account_id ?? null,
            oldAccountBalance:
              data.old_account_balance !== null && data.old_account_balance !== undefined
                ? Number(data.old_account_balance)
                : null,
            newAccountId: data.new_account_id ?? validAccountUuid,
            newAccountBalance:
              data.new_account_balance !== null && data.new_account_balance !== undefined
                ? Number(data.new_account_balance)
                : null,
            usedAtomicRpc: true,
          };
        }

        if (error) {
          console.warn('transactionService.updateTransactionAtomic RPC warning:', error.message);
        }
      } catch (err) {
        console.warn('transactionService.updateTransactionAtomic RPC exception:', err);
      }

      // Direct-table fallback if RPC unavailable
      try {
        const categoryId = await resolveCategoryId(canonicalCat, tx.income);
        const { error } = await supabase
          .from('transactions')
          .update({
            nama: tx.name.trim(),
            nominal: tx.amount,
            jenis: tx.income ? 'masuk' : 'keluar',
            tanggal: parsedDate.isoDate,
            category_id: categoryId,
            account_id: validAccountUuid,
            merchant: tx.merchant || tx.name.trim(),
            metode_bayar: tx.metode_bayar || 'Bank',
            catatan: tx.catatan ?? null,
          })
          .eq('id', txId)
          .eq('user_id', userId);

        if (error) {
          return {
            updated: false,
            transactionId: null,
            oldAccountId: null,
            oldAccountBalance: null,
            newAccountId: null,
            newAccountBalance: null,
            usedAtomicRpc: false,
            error: error.message,
          };
        }

        return {
          updated: true,
          transactionId: txId,
          oldAccountId: null,
          oldAccountBalance: null,
          newAccountId: validAccountUuid,
          newAccountBalance: null,
          usedAtomicRpc: false,
        };
      } catch (err: any) {
        return {
          updated: false,
          transactionId: null,
          oldAccountId: null,
          oldAccountBalance: null,
          newAccountId: null,
          newAccountBalance: null,
          usedAtomicRpc: false,
          error: err?.message || 'Gagal memperbarui transaksi.',
        };
      }
    }

    return {
      updated: true,
      transactionId: String(txId),
      oldAccountId: null,
      oldAccountBalance: null,
      newAccountId: validAccountUuid,
      newAccountBalance: null,
      usedAtomicRpc: false,
    };
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
    return {
      deleted: ok,
      accountId: null,
      newBalance: null,
      error: ok ? undefined : 'Gagal menghapus transaksi dari database.',
    };
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

  async fetchDashboardSummary(periode: string): Promise<DashboardSummaryRpcResult | null> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary', {
        p_periode: periode,
      });
      if (error || !data) {
        return null;
      }
      return data as DashboardSummaryRpcResult;
    } catch {
      return null;
    }
  },
};
