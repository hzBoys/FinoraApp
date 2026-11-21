import { supabase } from '../supabase';
import { Account, AccountType } from '../../models/types';

export const accountService = {
  async fetchAccounts(userId: string): Promise<Account[] | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('accountService.fetchAccounts warning:', error.message);
        return null;
      }

      if (!data) return null;
      if (data.length === 0) return [];

      return data.map((item: any) => ({
        account_id: item.id,
        user_id: item.user_id,
        nama_akun: item.nama_akun,
        tipe: item.tipe as AccountType,
        saldo: Number(item.saldo),
        updated_at: item.updated_at
          ? item.updated_at.split('T')[0]
          : new Date().toISOString().split('T')[0],
      }));
    } catch (err) {
      console.warn('accountService.fetchAccounts exception:', err);
      return null;
    }
  },

  async updateAccountBalance(accountId: string | number, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          saldo: Math.max(0, Math.round(newBalance)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      if (error) {
        console.warn('accountService.updateAccountBalance warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('accountService.updateAccountBalance exception:', err);
      return false;
    }
  },

  async upsertAccount(
    userId: string,
    namaAkun: string,
    tipe: AccountType,
    saldo: number
  ): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .upsert(
          {
            user_id: userId,
            nama_akun: namaAkun.trim(),
            tipe,
            saldo: Math.max(0, Math.round(saldo)),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,nama_akun' }
        )
        .select('*')
        .single();

      if (error || !data) {
        console.warn('accountService.upsertAccount warning:', error?.message);
        return null;
      }

      return {
        account_id: data.id,
        user_id: data.user_id,
        nama_akun: data.nama_akun,
        tipe: data.tipe as AccountType,
        saldo: Number(data.saldo),
        updated_at: data.updated_at
          ? data.updated_at.split('T')[0]
          : new Date().toISOString().split('T')[0],
      };
    } catch (err) {
      console.warn('accountService.upsertAccount exception:', err);
      return null;
    }
  },

  async deleteAccount(accountId: string | number): Promise<{ deleted: boolean; error?: string }> {
    if (typeof accountId !== 'string' || !accountId.includes('-')) {
      return { deleted: true };
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc('delete_account_safe', {
        p_account_id: accountId,
      });

      if (!rpcErr && data) {
        return { deleted: Boolean(data.deleted) };
      }

      if (rpcErr && !/function|schema cache/i.test(rpcErr.message || '')) {
        return { deleted: false, error: rpcErr.message };
      }
    } catch {
      // Fallback to direct delete if Phase 3 RPC is not yet deployed
    }

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', accountId);
      if (error) {
        console.warn('accountService.deleteAccount warning:', error.message);
        return { deleted: false, error: error.message };
      }
      return { deleted: true };
    } catch (err: any) {
      console.warn('accountService.deleteAccount exception:', err);
      return { deleted: false, error: err?.message || 'Gagal menghapus akun.' };
    }
  },
};
