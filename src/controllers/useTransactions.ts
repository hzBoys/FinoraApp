import { useEffect, useMemo, useState } from 'react';
import { INITIAL_TRANSACTIONS } from '../models/mockData';
import { Tx } from '../models/types';
import {
  AtomicCreateTxResult,
  AtomicDeleteTxResult,
  transactionService,
} from '../services/db/transactionService';
import {
  formatToDisplay,
  getCurrentPeriodKey,
  getPeriodKeyFromDate,
} from '../utils/date';

export function useTransactions(userId?: string | number) {
  const [transactions, setTransactions] = useState<Tx[]>(INITIAL_TRANSACTIONS);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('Semua');

  const activePeriod = useMemo(() => getCurrentPeriodKey(), []);

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
      const matchCat = activeCat === 'Semua' || tx.cat === activeCat;
      const matchQ =
        !q ||
        tx.name.toLowerCase().includes(q) ||
        tx.cat.toLowerCase().includes(q) ||
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
        .filter((t) => !t.income && t.cat !== 'Transfer')
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

  const addTransaction = async (newTx: Tx): Promise<AtomicCreateTxResult> => {
    const tempId = newTx.id;
    const localTx: Tx = {
      ...newTx,
      date: formatToDisplay(newTx.date),
    };

    setTransactions((prev) => [localTx, ...prev]);

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const res = await transactionService.createTransactionAtomic(userId, newTx);
      if (res.transactionId) {
        setTransactions((prev) =>
          prev.map((item) =>
            item.id === tempId ? { ...item, id: res.transactionId as string } : item
          )
        );
      }
      return res;
    }

    return {
      transactionId: null,
      accountId: null,
      newBalance: null,
      usedAtomicRpc: false,
    };
  };

  const removeTransaction = async (txId: string | number): Promise<AtomicDeleteTxResult> => {
    setTransactions((prev) => prev.filter((item) => item.id !== txId));

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      return transactionService.deleteTransactionAtomic(txId);
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
    removeTransaction,
  };
}
