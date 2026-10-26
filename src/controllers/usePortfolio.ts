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

  // Sync from Supabase if userId is provided
  useEffect(() => {
    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;

    let isMounted = true;
    async function loadAccounts() {
      const remote = await accountService.fetchAccounts(userId as string);
      if (isMounted && remote !== null) {
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

  const updateBalance = (namaAkun: string, tipe: AccountType, nominalSaldo: number) => {
    setAccounts((prev) => upsertAccountBalance(prev, namaAkun, tipe, nominalSaldo));

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      accountService.upsertAccount(userId, namaAkun, tipe, nominalSaldo);
    }
  };

  const deductAccountBalance = (accountId: number | string, amount: number, isIncome: boolean) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.account_id === accountId) {
          const delta = isIncome ? amount : -amount;
          const newBalance = Math.max(0, acc.saldo + delta);

          if (userId && typeof accountId === 'string' && accountId.includes('-')) {
            accountService.updateAccountBalance(accountId, newBalance);
          }

          return {
            ...acc,
            saldo: newBalance,
            updated_at: new Date().toISOString().split('T')[0],
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
    deductAccountBalance,
  };
}
