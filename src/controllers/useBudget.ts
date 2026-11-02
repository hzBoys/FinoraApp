import { useEffect, useMemo, useState } from 'react';
import { BUDGET_CATS, INITIAL_BUDGET } from '../models/mockData';
import { Budget, Tx } from '../models/types';
import { analyzeSmartAdvisor } from './services/smartAdvisorService';
import { budgetService } from '../services/db/budgetService';
import { generateSmartAdvisorNarrative } from '../services/ai/geminiAdvisorService';
import { getCurrentPeriodKey, getPeriodKeyFromDate } from '../utils/date';

export type CategoryLimits = Record<string, number>;

const DEFAULT_ADVISOR_RATIOS: Record<string, number> = {
  Makan: 0.3,
  Transportasi: 0.15,
  Tagihan: 0.15,
  Belanja: 0.1,
  Hiburan: 0.1,
};

export function buildDefaultAdvisorLimits(total: number): CategoryLimits {
  return {
    Makan: Math.round(total * DEFAULT_ADVISOR_RATIOS.Makan),
    Transportasi: Math.round(total * DEFAULT_ADVISOR_RATIOS.Transportasi),
    Tagihan: Math.round(total * DEFAULT_ADVISOR_RATIOS.Tagihan),
    Belanja: Math.round(total * DEFAULT_ADVISOR_RATIOS.Belanja),
    Hiburan: Math.round(total * DEFAULT_ADVISOR_RATIOS.Hiburan),
  };
}

export function useBudget(transactions: Tx[], userId?: string | number) {
  const [budget, setBudget] = useState<Budget>(INITIAL_BUDGET);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimits>({});
  const [aiRecommendationText, setAiRecommendationText] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const activePeriod = useMemo(() => getCurrentPeriodKey(), []);

  useEffect(() => {
    setBudget({ ...INITIAL_BUDGET, periode: activePeriod });
    setCategoryLimits({});
    setAiRecommendationText(null);

    if (!userId || typeof userId !== 'string' || !userId.includes('-')) return;

    let isMounted = true;
    async function loadBudget() {
      const remote = await budgetService.fetchBudget(userId as string, activePeriod);
      if (isMounted && remote) {
        setBudget(remote);
        setCategoryLimits(remote.category_limits ?? {});

        if (typeof remote.budget_id === 'string' && remote.budget_id.includes('-')) {
          const latestRec = await budgetService.fetchLatestRecommendation(remote.budget_id);
          if (isMounted && latestRec?.isi_saran) {
            setAiRecommendationText(latestRec.isi_saran);
          }
        }
      }
    }
    loadBudget();

    return () => {
      isMounted = false;
    };
  }, [userId, activePeriod]);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => getPeriodKeyFromDate(t.date) === activePeriod),
    [transactions, activePeriod]
  );

  const categorySpendings = useMemo(() => {
    return BUDGET_CATS.map((cat) => {
      let catBudget = categoryLimits[cat.key];

      if (catBudget === undefined) {
        const ratio = DEFAULT_ADVISOR_RATIOS[cat.key] ?? 0.1;
        catBudget = budget.total_anggaran > 0 ? Math.round(budget.total_anggaran * ratio) : 0;
      }

      const used = monthlyTransactions
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
  }, [monthlyTransactions, budget.total_anggaran, categoryLimits]);

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
    () => analyzeSmartAdvisor(monthlyTransactions, activePeriod),
    [monthlyTransactions, activePeriod]
  );

  const advisorRecommendationText = aiRecommendationText || advisorAnalysis.recommendationText;

  const setBudgetLimit = async (total: number, customLimits?: CategoryLimits) => {
    const nextLimits = customLimits ?? buildDefaultAdvisorLimits(total);

    setBudget((prev) => ({
      ...prev,
      periode: activePeriod,
      total_anggaran: total,
      category_limits: nextLimits,
    }));
    setCategoryLimits(nextLimits);

    if (userId && typeof userId === 'string' && userId.includes('-')) {
      const saved = await budgetService.upsertBudget(userId, {
        periode: activePeriod,
        total_anggaran: total,
        persen_kebutuhan: budget.persen_kebutuhan ?? 60,
        persen_gaya_hidup: budget.persen_gaya_hidup ?? 20,
        persen_tabungan: budget.persen_tabungan ?? 20,
        category_limits: nextLimits,
      });
      if (saved) {
        setBudget(saved);
      }
    }
  };

  const refreshAiAdvisor = async (): Promise<string> => {
    if (isGeneratingAdvice) return advisorRecommendationText;

    setIsGeneratingAdvice(true);
    try {
      const aiRes = await generateSmartAdvisorNarrative({
        periode: activePeriod,
        totalBudget: budget.total_anggaran,
        totalUsed,
        analysis: advisorAnalysis,
        categorySpendings,
      });

      setAiRecommendationText(aiRes.isi_saran);

      if (userId && typeof userId === 'string' && userId.includes('-')) {
        let targetBudgetId =
          typeof budget.budget_id === 'string' && budget.budget_id.includes('-')
            ? budget.budget_id
            : null;

        if (!targetBudgetId) {
          const ensuredBudget = await budgetService.upsertBudget(userId, {
            periode: activePeriod,
            total_anggaran: budget.total_anggaran,
            persen_kebutuhan: budget.persen_kebutuhan ?? 60,
            persen_gaya_hidup: budget.persen_gaya_hidup ?? 20,
            persen_tabungan: budget.persen_tabungan ?? 20,
            category_limits: Object.keys(categoryLimits).length > 0 ? categoryLimits : null,
          });
          if (ensuredBudget && typeof ensuredBudget.budget_id === 'string') {
            setBudget(ensuredBudget);
            targetBudgetId = ensuredBudget.budget_id;
          }
        }

        if (targetBudgetId) {
          await budgetService.saveRecommendation(
            targetBudgetId,
            aiRes.isi_saran,
            advisorAnalysis.lifestyleReductionNeeded
          );
        }
      }

      return aiRes.isi_saran;
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return {
    budget,
    categoryLimits,
    categorySpendings,
    totalUsed,
    totalPct,
    totalRemaining,
    unallocated,
    nearLimitCategories,
    advisorAnalysis,
    advisorRecommendationText,
    isAiRecommendation: Boolean(aiRecommendationText),
    isGeneratingAdvice,
    setBudgetLimit,
    refreshAiAdvisor,
  };
}
