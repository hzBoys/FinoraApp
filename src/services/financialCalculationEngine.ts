/**
 * Financial Calculation Engine (P0.2)
 *
 * Pure, deterministic, side-effect-free functions.
 * No Gemini, no thresholds, no status labels — only metric primitives.
 *
 * Rules:
 * - null input → null output (never coerce to 0 silently)
 * - Division by zero → null
 * - Methodology Pending Validation markers on thresholds not yet set
 * - All inputs typed — no implicit fallbacks
 */

import { Account, Budget, Tx } from '../models/types';
import { FinancialProfile, FinancialMetrics } from '../models/financialIntelligence';
import { getPeriodKeyFromDate } from '../utils/date';

// ─── Primitive Helpers (exported for unit testing) ────────────────────────────

/** Safe division. Returns null if denominator is 0 or null. */
export function safeDivide(numerator: number, denominator: number | null): number | null {
  if (denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

/** Percentage = (part / whole) * 100. null if whole = 0 or null. */
export function safePercent(part: number, whole: number | null): number | null {
  const ratio = safeDivide(part, whole);
  return ratio !== null ? Math.round(ratio * 100 * 10) / 10 : null;
}

// ─── Observed Transaction Metrics ─────────────────────────────────────────────

/**
 * Sum of income transactions for a given period.
 * Observed inflow only — MUST NOT be used as declared monthly income.
 */
export function calcObservedMonthlyInflow(transactions: Tx[], periodKey: string): number {
  return transactions
    .filter((t) => t.income && getPeriodKeyFromDate(t.date) === periodKey)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Sum of kebutuhan + gaya_hidup spending for a given period.
 * Transfer excluded from spending total.
 */
export function calcObservedMonthlySpending(transactions: Tx[], periodKey: string): number {
  return transactions
    .filter(
      (t) =>
        !t.income &&
        t.cat !== 'Transfer' &&
        getPeriodKeyFromDate(t.date) === periodKey
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Discretionary spending = Belanja + Hiburan (gaya_hidup proxy from transactions).
 */
export function calcDiscretionarySpending(transactions: Tx[], periodKey: string): number {
  return transactions
    .filter(
      (t) =>
        !t.income &&
        ['Belanja', 'Hiburan'].includes(t.cat) &&
        getPeriodKeyFromDate(t.date) === periodKey
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Portfolio / Liquidity ─────────────────────────────────────────────────────

/**
 * Available Liquidity = sum of bank + ewallet balances.
 * Investasi excluded — treated as non-liquid.
 */
export function calcAvailableLiquidity(accounts: Account[]): number {
  return accounts
    .filter((a) => a.tipe === 'bank' || a.tipe === 'ewallet')
    .reduce((sum, a) => sum + a.saldo, 0);
}

/**
 * Net Worth = total_assets - total_liabilities.
 * total_liabilities not available in current schema → returns null.
 * Will be non-null once debt tracking is introduced.
 * Methodology Pending Validation.
 */
export function calcNetWorth(accounts: Account[]): null {
  // ponytail: liabilities not in schema yet — returns null until debt table exists (P5+)
  void accounts;
  return null;
}

// ─── Declared Profile Metrics ─────────────────────────────────────────────────

/**
 * Net Cash Flow = monthly_income - observed_spending - monthly_debt_payments
 * null if monthly_income not declared.
 *
 * Uses declared income (not observed inflow) as the base.
 */
export function calcNetCashFlow(
  monthlyIncome: number | null,
  observedSpending: number,
  monthlyDebtPayments: number
): number | null {
  if (monthlyIncome === null) return null;
  return monthlyIncome - observedSpending - monthlyDebtPayments;
}

/**
 * Savings Capacity = max(0, monthly_income - monthly_essential_expenses - monthly_debt_payments)
 * Structural capacity, not actual savings behavior.
 * null if monthly_income or monthly_essential_expenses not declared.
 */
export function calcSavingsCapacity(
  monthlyIncome: number | null,
  monthlyEssentialExpenses: number | null,
  monthlyDebtPayments: number
): number | null {
  if (monthlyIncome === null || monthlyEssentialExpenses === null) return null;
  return Math.max(0, monthlyIncome - monthlyEssentialExpenses - monthlyDebtPayments);
}

/**
 * Savings Rate = (monthly_income - observed_spending - debt_payments) / monthly_income * 100
 * Uses declared income as denominator.
 * null if monthly_income not declared or = 0.
 * Methodology Pending Validation: target threshold not set.
 */
export function calcSavingsRate(
  monthlyIncome: number | null,
  observedSpending: number,
  monthlyDebtPayments: number
): number | null {
  if (monthlyIncome === null || monthlyIncome === 0) return null;
  const actualSavings = monthlyIncome - observedSpending - monthlyDebtPayments;
  return safePercent(actualSavings, monthlyIncome);
}

/**
 * Expense-to-Income Ratio = observed_spending / monthly_income * 100
 * null if monthly_income not declared.
 * Methodology Pending Validation.
 */
export function calcExpenseToIncomeRatio(
  observedSpending: number,
  monthlyIncome: number | null
): number | null {
  return safePercent(observedSpending, monthlyIncome);
}

/**
 * Debt-to-Income Ratio = monthly_debt_payments / monthly_income * 100
 * Uses declared debt payments — NOT Tagihan transaction category.
 * null if monthly_income not declared.
 * Methodology Pending Validation.
 */
export function calcDebtToIncomeRatio(
  monthlyDebtPayments: number,
  monthlyIncome: number | null
): number | null {
  return safePercent(monthlyDebtPayments, monthlyIncome);
}

/**
 * Emergency Fund Coverage = emergency_fund / monthly_essential_expenses (in months)
 * Denominator = declared essential expenses (NOT actual spending).
 * null if either not declared or essential_expenses = 0.
 * Methodology Pending Validation: target months (3–6) not finalized.
 */
export function calcEmergencyFundCoverage(
  emergencyFund: number | null,
  monthlyEssentialExpenses: number | null
): number | null {
  if (emergencyFund === null || monthlyEssentialExpenses === null) return null;
  const months = safeDivide(emergencyFund, monthlyEssentialExpenses);
  return months !== null ? Math.round(months * 10) / 10 : null;
}

/**
 * Budget Utilization = observed_spending / total_anggaran * 100
 * Returns 0 if no budget set (total_anggaran = 0).
 */
export function calcBudgetUtilization(
  observedSpending: number,
  budget: Budget
): number {
  if (budget.total_anggaran <= 0) return 0;
  return Math.round((observedSpending / budget.total_anggaran) * 100 * 10) / 10;
}

/**
 * Unallocated Cash = availableLiquidity - essential_expenses - debt_payments - goal_allocation
 * null if monthly_essential_expenses not declared.
 */
export function calcUnallocatedCash(
  availableLiquidity: number,
  monthlyEssentialExpenses: number | null,
  monthlyDebtPayments: number,
  goalMonthlyAllocation: number
): number | null {
  if (monthlyEssentialExpenses === null) return null;
  return Math.max(
    0,
    availableLiquidity - monthlyEssentialExpenses - monthlyDebtPayments - goalMonthlyAllocation
  );
}

// ─── Composite: Full Metrics Object ───────────────────────────────────────────

/**
 * Compute all financial metrics from available inputs.
 * Any metric with insufficient declared data returns null.
 * Never fabricates values. Never falls back silently to observed inflow for declared income.
 */
export function computeFinancialMetrics(params: {
  profile: FinancialProfile | null;
  transactions: Tx[];
  accounts: Account[];
  budget: Budget;
  periodKey: string;
}): FinancialMetrics {
  const { profile, transactions, accounts, budget, periodKey } = params;

  const monthlyIncome = profile?.monthly_income ?? null;
  const monthlyEssentialExpenses = profile?.monthly_essential_expenses ?? null;
  const monthlyDebtPayments = profile?.monthly_debt_payments ?? 0;
  const emergencyFund = profile?.emergency_fund ?? null;
  const goalMonthlyAllocation = profile?.goal_monthly_allocation ?? 0;

  const observedMonthlyInflow = calcObservedMonthlyInflow(transactions, periodKey);
  const observedMonthlySpending = calcObservedMonthlySpending(transactions, periodKey);
  const discretionarySpending = calcDiscretionarySpending(transactions, periodKey);
  const availableLiquidity = calcAvailableLiquidity(accounts);

  return {
    netCashFlow: calcNetCashFlow(monthlyIncome, observedMonthlySpending, monthlyDebtPayments),
    savingsCapacity: calcSavingsCapacity(monthlyIncome, monthlyEssentialExpenses, monthlyDebtPayments),
    savingsRate: calcSavingsRate(monthlyIncome, observedMonthlySpending, monthlyDebtPayments),
    expenseToIncomeRatio: calcExpenseToIncomeRatio(observedMonthlySpending, monthlyIncome),
    debtToIncomeRatio: calcDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome),
    emergencyFundCoverage: calcEmergencyFundCoverage(emergencyFund, monthlyEssentialExpenses),
    budgetUtilization: calcBudgetUtilization(observedMonthlySpending, budget),
    discretionarySpending,
    availableLiquidity,
    unallocatedCash: calcUnallocatedCash(
      availableLiquidity,
      monthlyEssentialExpenses,
      monthlyDebtPayments,
      goalMonthlyAllocation
    ),
    netWorth: calcNetWorth(accounts),
    observedMonthlyInflow,
    observedMonthlySpending,
  };
}
