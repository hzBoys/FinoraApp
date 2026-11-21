import { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_TRANSACTIONS } from '../models/mockData';
import { Tx } from '../models/types';
import {
  AtomicCreateTxResult,
  AtomicDeleteTxResult,
  AtomicUpdateTxResult,
  transactionService,
} from '../services/db/transactionService';
import {
  compareDateStringsDesc,
  formatToDisplay,
  getCurrentPeriodKey,
  getPeriodKeyFromDate,
} from '../utils/date';
import { normalizeCategoryName } from './services/magicReceiptService';

function insertSortedByDateDesc(list: Tx[], item: Tx): Tx[] {
  const next = [item, ...list];
  return next.sort((a, b) => compareDateStringsDesc(a.date, b.date));
}

export function useTransactions(userId?: string | number) {
  const [transactions, setTransactions] = useState<Tx[]>(INITIAL_TRANSACTIONS);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('Semua');

  const activePeriod = getCurrentPeriodKey();

  const refreshTransactions = useCallback(async () => {
    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;
    const remote = await transactionService.fetchTransactions(userId);
    if (remote !== null) {
      setTransactions(remote);
    }
  }, [userId]);

  // Sync from Supabase when userId changes, and reset cleanly on logout/switch
  useEffect(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setQuery('');
    setActiveCat('Semua');

    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;

    let isMounted = true;
    async function loadTransactions() {
      const remote = await transactionService.fetchTransactions(userId as string);
      if (isMounted && remote !== null) {
        setTransactions(remote);
      }
    }
    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return transactions.filter((tx) => {
      const canonicalCat = normalizeCategoryName(tx.cat, tx.income);
      const matchCat = activeCat === 'Semua' || canonicalCat === activeCat;
      const matchQ =
        !q ||
        tx.name.toLowerCase().includes(q) ||
        canonicalCat.toLowerCase().includes(q) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [transactions, query, activeCat]);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => getPeriodKeyFromDate(t.date) === activePeriod),
    [transactions, activePeriod]
  );

  // Active month cashflow ("Arus Kas Bulan Ini" on HomeScreen)
  const totalIn = useMemo(
    () => monthlyTransactions.filter((t) => t.income).reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  const totalConsumptionOut = useMemo(
    () =>
      monthlyTransactions
        .filter((t) => !t.income && normalizeCategoryName(t.cat, false) !== 'Transfer')
        .reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  const filteredIn = useMemo(
    () => filtered.filter((t) => t.income).reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const filteredOut = useMemo(
    () => filtered.filter((t) => !t.income).reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);

  const addTransaction = async (
    newTx: Tx,
    scanId?: string | null
  ): Promise<AtomicCreateTxResult> => {
    const tempId = newTx.id;
    const canonicalCat = normalizeCategoryName(newTx.cat, newTx.income);
    const localTx: Tx = {
      ...newTx,
      cat: canonicalCat,
      date: formatToDisplay(newTx.date),
    };

    setTransactions((prev) => insertSortedByDateDesc(prev, localTx));

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const res = await transactionService.createTransactionAtomic(
        userId,
        { ...newTx, cat: canonicalCat },
        scanId
      );

      if (res.transactionId) {
        setTransactions((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: res.transactionId as string,
                  account_id: res.accountId ?? item.account_id,
                }
              : item
          )
        );
      } else {
        // Roll back optimistic item when remote persistence failed
        setTransactions((prev) => prev.filter((item) => item.id !== tempId));
      }
      return res;
    }

    return {
      transactionId: String(tempId),
      accountId:
        typeof newTx.account_id === 'string' || typeof newTx.account_id === 'number'
          ? String(newTx.account_id)
          : null,
      newBalance: null,
      usedAtomicRpc: false,
    };
  };

  const editTransaction = async (
    txId: string | number,
    updatedTx: Tx
  ): Promise<AtomicUpdateTxResult> => {
    const canonicalCat = normalizeCategoryName(updatedTx.cat, updatedTx.income);
    const normalizedLocal: Tx = {
      ...updatedTx,
      id: txId,
      cat: canonicalCat,
      date: formatToDisplay(updatedTx.date),
    };

    let previousSnapshot: Tx[] = [];
    setTransactions((prev) => {
      previousSnapshot = prev;
      const replaced = prev.map((item) => (item.id === txId ? normalizedLocal : item));
      return replaced.sort((a, b) => compareDateStringsDesc(a.date, b.date));
    });

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const res = await transactionService.updateTransactionAtomic(userId, txId, {
        ...updatedTx,
        cat: canonicalCat,
      });

      if (!res.updated) {
        setTransactions(previousSnapshot);
      }
      return res;
    }

    return {
      updated: true,
      transactionId: String(txId),
      oldAccountId: null,
      oldAccountBalance: null,
      newAccountId:
        updatedTx.account_id !== undefined ? String(updatedTx.account_id) : null,
      newAccountBalance: null,
      usedAtomicRpc: false,
    };
  };

  const removeTransaction = async (txId: string | number): Promise<AtomicDeleteTxResult> => {
    let previousSnapshot: Tx[] = [];
    setTransactions((prev) => {
      previousSnapshot = prev;
      return prev.filter((item) => item.id !== txId);
    });

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const res = await transactionService.deleteTransactionAtomic(txId);
      if (!res.deleted) {
        setTransactions(previousSnapshot);
      }
      return res;
    }

    return { deleted: true, accountId: null, newBalance: null };
  };

  return {
    transactions,
    filtered,
    query,
    setQuery,
    activeCat,
    setActiveCat,
    totalIn,
    totalConsumptionOut,
    filteredIn,
    filteredOut,
    recentTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    refreshTransactions,
  };
}
