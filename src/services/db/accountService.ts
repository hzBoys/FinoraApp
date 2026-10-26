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
        updated_at: item.updated_at ? item.updated_at.split('T')[0] : '2026-10-26',
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
          saldo: newBalance,
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
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('accounts').upsert(
        {
          user_id: userId,
          nama_akun: namaAkun,
          tipe,
          saldo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,nama_akun' }
      );

      if (error) {
        console.warn('accountService.upsertAccount warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('accountService.upsertAccount exception:', err);
      return false;
    }
  },
};
