/**
 * Financial Intelligence — Type Definitions (P0.1)
 *
 * Semantically separated from UserProfile (account profile).
 * Financial Profile = financial context of the user.
 * Account Profile = identity/preferences (nama, username, avatar, etc.)
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmploymentStatus =
  | 'mahasiswa'
  | 'karyawan'
  | 'freelancer'
  | 'wirausaha'
  | 'lainnya';

export type IncomeStability = 'tetap' | 'relatif_stabil' | 'fluktuatif';

export type RiskTolerance = 'konservatif' | 'moderat' | 'agresif';

export type InvestmentExperience =
  | 'belum_pernah'
  | 'pemula'
  | 'menengah'
  | 'berpengalaman';

// ─── Financial Profile (P0.1) ─────────────────────────────────────────────────

/**
 * Declared financial context. Stored in public.financial_profiles.
 * Progressive: not all fields required at once.
 * null = not yet declared by user (not 0).
 */
export type FinancialProfile = {
  id?: string;
  user_id: string;

  // Step 1 — Personal Context & Income
  employment_status: EmploymentStatus;
  /** Declared recurring monthly income. MUST NOT be confused with transaction inflow. */
  monthly_income: number | null;
  income_stability: IncomeStability | null;

  // Step 2 — Expenses, Obligations, Safety
  /**
   * Budgeted essential monthly expenses.
   * Used as denominator for Emergency Fund Coverage.
   * MUST NOT be confused with actual category spending from transactions.
   */
  monthly_essential_expenses: number | null;
  /**
   * Explicit monthly debt/cicilan payments (KPR, kendaraan, pinjaman).
   * MUST NOT be conflated with 'Tagihan' transaction category.
   */
  monthly_debt_payments: number;
  /**
   * Declared liquid emergency fund.
   * MUST NOT be derived from account saldo automatically.
   */
  emergency_fund: number | null;
  dependents: number;

  // Step 3 — Goals (minimal; full goal system at P2)
  primary_goal: string | null;
  goal_target_amount: number | null;
  goal_target_date: string | null;    // ISO date string
  goal_monthly_allocation: number;

  // Extended — Risk & Investment (collected now, used at P6/P7)
  risk_tolerance: RiskTolerance | null;
  investment_experience: InvestmentExperience | null;

  // Progressive profiling tracking
  profile_step_completed: 0 | 1 | 2 | 3;

  created_at?: string;
  updated_at?: string;
};

/** Subset required for step 1 of progressive profiling onboarding */
export type FinancialProfileStep1 = Pick<
  FinancialProfile,
  'employment_status' | 'monthly_income' | 'income_stability'
>;

/** Subset required for step 2 */
export type FinancialProfileStep2 = Pick<
  FinancialProfile,
  | 'monthly_essential_expenses'
  | 'monthly_debt_payments'
  | 'emergency_fund'
  | 'dependents'
>;

/** Subset for step 3 (goals — optional at P0) */
export type FinancialProfileStep3 = Pick<
  FinancialProfile,
  | 'primary_goal'
  | 'goal_target_amount'
  | 'goal_target_date'
  | 'goal_monthly_allocation'
>;

// ─── Financial Calculation Engine Output (P0.2) ───────────────────────────────

/**
 * Raw financial metrics computed deterministically.
 * null = insufficient data (required declared input missing).
 * No thresholds or status labels here — those belong in Financial Health (P1.2).
 *
 * Methodology notes are inline where thresholds are NOT yet validated.
 */
export type FinancialMetrics = {
  /**
   * Net Cash Flow = declared_monthly_income - total_actual_spending - monthly_debt_payments
   * null if monthly_income not declared.
   */
  netCashFlow: number | null;

  /**
   * Savings Capacity = max(0, monthly_income - monthly_essential_expenses - monthly_debt_payments)
   * Represents structural capacity, not actual savings behavior.
   * null if monthly_income or monthly_essential_expenses not declared.
   */
  savingsCapacity: number | null;

  /**
   * Savings Rate = actual_savings / monthly_income * 100
   * actual_savings derived from transaction inflow - outflow (observed, not declared).
   * null if monthly_income = 0 or not declared (guards division by zero).
   * Methodology Pending Validation: threshold for "good" savings rate not set.
   */
  savingsRate: number | null;

  /**
   * Expense-to-Income Ratio = total_actual_spending / monthly_income * 100
   * null if monthly_income not declared.
   * Methodology Pending Validation: threshold not set.
   */
  expenseToIncomeRatio: number | null;

  /**
   * Debt-to-Income Ratio = monthly_debt_payments / monthly_income * 100
   * Uses declared monthly_debt_payments (NOT Tagihan category from transactions).
   * null if monthly_income not declared.
   * Methodology Pending Validation: threshold not set.
   */
  debtToIncomeRatio: number | null;

  /**
   * Emergency Fund Coverage = emergency_fund / monthly_essential_expenses
   * Result in months. Denominator = declared monthly_essential_expenses (NOT actual spending).
   * null if either not declared or monthly_essential_expenses = 0.
   * Methodology Pending Validation: target months (e.g. 3–6) not finalized.
   */
  emergencyFundCoverage: number | null;

  /**
   * Budget Utilization = total_actual_spending / total_anggaran * 100
   * Uses existing budget from useBudget. 0 if no budget set.
   */
  budgetUtilization: number;

  /**
   * Discretionary Spending = gaya_hidup expenses from transactions (Belanja + Hiburan)
   * Observed from actual transactions. Never null (defaults to 0).
   */
  discretionarySpending: number;

  /**
   * Available Liquidity = sum of bank + ewallet account balances
   * investasi excluded from liquidity (non-liquid).
   */
  availableLiquidity: number;

  /**
   * Unallocated Cash = availableLiquidity - monthly_essential_expenses - monthly_debt_payments - goal_monthly_allocation
   * null if monthly_essential_expenses not declared.
   */
  unallocatedCash: number | null;

  /**
   * Net Worth = total_assets - total_liabilities
   * total_assets = totalBalance (all accounts)
   * total_liabilities: NOT available in current schema (no debt tracking table).
   * Returns null until liabilities data is available. Never fabricated.
   * Methodology Pending Validation.
   */
  netWorth: number | null;

  /**
   * Observed transaction inflow this month.
   * Context/comparison only — MUST NOT replace declared monthly_income in calculations.
   */
  observedMonthlyInflow: number;

  /**
   * Observed total spending (kebutuhan + gaya_hidup) this month from transactions.
   */
  observedMonthlySpending: number;
};

// ─── Insufficient Data Sentinel ───────────────────────────────────────────────

/**
 * Returned by calculation functions when required declared inputs are missing.
 * UI should show CTA to complete Financial Profile, not show Rp0.
 */
export type InsufficientData = {
  kind: 'insufficient_data';
  missingFields: (keyof FinancialProfile)[];
  ctaMessage: string;
};

export function isInsufficientData(v: unknown): v is InsufficientData {
  return typeof v === 'object' && v !== null && (v as any).kind === 'insufficient_data';
}

// ─── Financial Health (P1.2 — architecture ready, implementation at P1) ───────

/**
 * Status labels — derived from metrics, NOT from AI or arbitrary scoring.
 * Methodology Pending Validation: thresholds for each status not finalized.
 * Architecture ready here so P1 implementation needs no type rewrite.
 */
export type FinancialHealthStatus =
  | 'needs_attention'
  | 'fair'
  | 'stable'
  | 'healthy'
  | 'strong'
  | 'insufficient_data';

export type HealthDimension = {
  key: string;
  label: string;
  status: FinancialHealthStatus;
  /** Raw metric value. null = insufficient data. */
  value: number | null;
  unit?: string;        // e.g. '%', 'bulan', 'Rp'
  note: string;         // Human-readable explanation of the value
  /** True if methodology for this dimension's thresholds is not yet validated */
  methodologyPendingValidation?: boolean;
};

export type FinancialHealth = {
  overallStatus: FinancialHealthStatus;
  dimensions: {
    cashFlow: HealthDimension;
    safetyBuffer: HealthDimension;
    debtPosition: HealthDimension;
    spendingControl: HealthDimension;
    savingsCapacity: HealthDimension;
    incomeStability: HealthDimension;
  };
  /** Primary bottleneck identified. null if no clear bottleneck. */
  bottleneck: string | null;
  /** AI-generated narrative (optional). Financial Health MUST render without this. */
  aiExplanation?: string;
  /** True if AI explanation generation failed — Financial Health still renders */
  aiExplanationFailed?: boolean;
};

// ─── Safe-to-Spend (P1.1 — architecture ready) ───────────────────────────────

/**
 * Safe-to-Spend = AvailableIncome - MandatoryObligations - SafetyAllocation - GoalAllocation
 *
 * SafetyAllocation methodology is Pending Validation.
 * Calculation components are separated so methodology can be plugged in later without rewrite.
 */
export type SafeToSpendBreakdown = {
  availableIncome: number;
  mandatoryObligations: number;    // monthly_essential_expenses + monthly_debt_payments
  safetyAllocation: number;        // Methodology Pending Validation — placeholder 0 at P0
  goalAllocation: number;          // goal_monthly_allocation from profile
};

export type SafeToSpend = {
  amount: number;
  breakdown: SafeToSpendBreakdown;
  daysRemainingInMonth: number;
  /** Estimated daily budget for remaining days */
  dailyBudget: number;
} | InsufficientData;
