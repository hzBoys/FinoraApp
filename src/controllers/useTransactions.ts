import { useEffect, useMemo, useState } from 'react';
import { INITIAL_TRANSACTIONS } from '../models/mockData';
import { Tx } from '../models/types';
import { transactionService } from '../services/db/transactionService';

export function useTransactions(userId?: string | number) {
  const [transactions, setTransactions] = useState<Tx[]>(INITIAL_TRANSACTIONS);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('Semua');

  // Sync from Supabase if userId is provided
  useEffect(() => {
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
      const matchQ = !q || tx.name.toLowerCase().includes(q) || tx.cat.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [transactions, query, activeCat]);

  const totalIn = useMemo(
    () => transactions.filter((t) => t.income).reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalConsumptionOut = useMemo(
    () =>
      transactions
        .filter((t) => !t.income && t.cat !== 'Transfer')
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
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

  const addTransaction = (newTx: Tx) => {
    setTransactions((prev) => [newTx, ...prev]);

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      transactionService.createTransaction(userId, newTx);
    }
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
  };
}
