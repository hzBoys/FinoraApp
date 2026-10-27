import { useEffect, useMemo, useState } from 'react';
import { BUDGET_CATS, INITIAL_BUDGET } from '../models/mockData';
import { Budget, Tx } from '../models/types';
import { analyzeSmartAdvisor } from './services/smartAdvisorService';
import { budgetService } from '../services/db/budgetService';
import { getCurrentPeriodKey } from '../utils/date';

export type CategoryLimits = Record<string, number>;

export function useBudget(transactions: Tx[], userId?: string | number) {
  const [budget, setBudget] = useState<Budget>(INITIAL_BUDGET);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimits>({});

  const activePeriod = useMemo(() => getCurrentPeriodKey(), []);

  useEffect(() => {
    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;

    let isMounted = true;
    async function loadBudget() {
      const remote = await budgetService.fetchBudget(userId as string, activePeriod);
      if (isMounted && remote) {
        setBudget(remote);
      }
    }
    loadBudget();

    return () => {
      isMounted = false;
    };
  }, [userId, activePeriod]);

  const categorySpendings = useMemo(() => {
    return BUDGET_CATS.map((cat) => {
      let catBudget = categoryLimits[cat.key];

      if (catBudget === undefined) {
        const ratio =
          cat.key === 'Makan'
            ? 0.3
            : cat.key === 'Transportasi'
            ? 0.15
            : cat.key === 'Tagihan'
            ? 0.15
            : 0.2;
        catBudget = budget.total_anggaran > 0 ? Math.round(budget.total_anggaran * ratio) : 0;
      }

      const used = transactions
        .filter((t) => !t.income && t.cat === cat.key)
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = catBudget > 0 ? Math.round((used / catBudget) * 100) : 0;

      return {
        ...cat,
        budget: catBudget,
        used,
        pct,
      };
    });
  }, [transactions, budget.total_anggaran, categoryLimits]);

  const totalUsed = useMemo(
    () => categorySpendings.reduce((sum, c) => sum + c.used, 0),
    [categorySpendings]
  );

  const totalPct =
    budget.total_anggaran > 0 ? Math.round((totalUsed / budget.total_anggaran) * 100) : 0;
  const totalRemaining = Math.max(0, budget.total_anggaran - totalUsed);
  const unallocated = Math.max(
    0,
    budget.total_anggaran - categorySpendings.reduce((sum, c) => sum + c.budget, 0)
  );

  const nearLimitCategories = useMemo(
    () => categorySpendings.filter((c) => c.budget > 0 && c.pct >= 75),
    [categorySpendings]
  );

  const advisorAnalysis = useMemo(
    () => analyzeSmartAdvisor(transactions),
    [transactions]
  );

  const setBudgetLimit = (total: number, customLimits?: CategoryLimits) => {
    setBudget((prev) => ({
      ...prev,
      total_anggaran: total,
    }));

    if (customLimits) {
      setCategoryLimits(customLimits);
    } else {
      setCategoryLimits({
        Makan: Math.round(total * 0.3),
        Transportasi: Math.round(total * 0.15),
        Tagihan: Math.round(total * 0.15),
        Belanja: Math.round(total * 0.2),
      });
    }

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      budgetService.upsertBudget(userId, {
        periode: activePeriod,
        total_anggaran: total,
      });
    }
  };

  return {
    budget,
    categorySpendings,
    totalUsed,
    totalPct,
    totalRemaining,
    unallocated,
    nearLimitCategories,
    advisorAnalysis,
    setBudgetLimit,
  };
}
