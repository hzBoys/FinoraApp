import { useEffect, useMemo, useState } from 'react';
import { INITIAL_ACCOUNTS } from '../models/mockData';
import { Account, AccountType } from '../models/types';
import {
  calculatePillars,
  calculateTotalPortfolio,
  upsertAccountBalance,
} from './services/autoPortfolioService';
import { accountService } from '../services/db/accountService';

export function usePortfolio(userId?: string | number) {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);

  // Sync from Supabase if userId is provided, and reset cleanly on logout/switch
  useEffect(() => {
    setAccounts(INITIAL_ACCOUNTS);

    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;

    let isMounted = true;
    async function loadAccounts() {
      const remote = await accountService.fetchAccounts(userId as string);
      if (isMounted && remote !== null && remote.length > 0) {
        setAccounts(remote);
      }
    }
    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const totalBalance = useMemo(() => calculateTotalPortfolio(accounts), [accounts]);
  const pillars = useMemo(() => calculatePillars(accounts), [accounts]);

  const updateBalance = async (
    namaAkun: string,
    tipe: AccountType,
    nominalSaldo: number
  ): Promise<Account | null> => {
    const cleanInputName = namaAkun.trim();
    if (!cleanInputName) return null;

    // Preserve canonical casing if an account with the same case-insensitive name already exists
    const existingMatch = accounts.find(
      (a) => a.nama_akun.trim().toLowerCase() === cleanInputName.toLowerCase()
    );
    const canonicalName = existingMatch ? existingMatch.nama_akun : cleanInputName;
    const safeSaldo = Math.max(0, Math.round(nominalSaldo));

    setAccounts((prev) => upsertAccountBalance(prev, canonicalName, tipe, safeSaldo));

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const remoteAcc = await accountService.upsertAccount(userId, canonicalName, tipe, safeSaldo);
      if (remoteAcc) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.nama_akun.trim().toLowerCase() === canonicalName.toLowerCase() ? remoteAcc : a
          )
        );
        return remoteAcc;
      }
    }

    return null;
  };

  const syncAccountBalanceLocal = (accountId: number | string, exactBalance: number) => {
    const todayIso = new Date().toISOString().split('T')[0];
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.account_id === accountId
          ? { ...acc, saldo: Math.max(0, exactBalance), updated_at: todayIso }
          : acc
      )
    );
  };

  const deductAccountBalance = (
    accountId: number | string,
    amount: number,
    isIncome: boolean,
    skipRemoteSync = false
  ) => {
    const todayIso = new Date().toISOString().split('T')[0];
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.account_id === accountId) {
          const delta = isIncome ? amount : -amount;
          const newBalance = Math.max(0, acc.saldo + delta);

          if (
            !skipRemoteSync &&
            userId &&
            typeof userId === 'string' &&
            userId.includes('-') &&
            typeof accountId === 'string' &&
            accountId.includes('-')
          ) {
            accountService.updateAccountBalance(accountId, newBalance);
          }

          return {
            ...acc,
            saldo: newBalance,
            updated_at: todayIso,
          };
        }
        return acc;
      })
    );
  };

  return {
    accounts,
    totalBalance,
    pillars,
    updateBalance,
    syncAccountBalanceLocal,
    deductAccountBalance,
  };
}
