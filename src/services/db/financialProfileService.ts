/**
 * Financial Profile Service (P0.1)
 * CRUD for public.financial_profiles via Supabase.
 * Follows profileService.ts pattern exactly.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import {
  FinancialProfile,
  EmploymentStatus,
  IncomeStability,
  RiskTolerance,
  InvestmentExperience,
} from '../../models/financialIntelligence';

// ─── DB row shape (snake_case from Supabase) ──────────────────────────────────

type FinancialProfileRow = {
  id: string;
  user_id: string;
  employment_status: string;
  monthly_income: string | null;
  income_stability: string | null;
  monthly_essential_expenses: string | null;
  monthly_debt_payments: string;
  emergency_fund: string | null;
  dependents: number;
  primary_goal: string | null;
  goal_target_amount: string | null;
  goal_target_date: string | null;
  goal_monthly_allocation: string;
  risk_tolerance: string | null;
  investment_experience: string | null;
  profile_step_completed: number;
  created_at: string;
  updated_at: string;
};

function rowToProfile(row: FinancialProfileRow): FinancialProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    employment_status: (row.employment_status as EmploymentStatus) ?? 'lainnya',
    monthly_income: row.monthly_income !== null ? Number(row.monthly_income) : null,
    income_stability: row.income_stability !== null
      ? (row.income_stability as IncomeStability)
      : null,
    monthly_essential_expenses: row.monthly_essential_expenses !== null
      ? Number(row.monthly_essential_expenses)
      : null,
    monthly_debt_payments: Number(row.monthly_debt_payments) || 0,
    emergency_fund: row.emergency_fund !== null ? Number(row.emergency_fund) : null,
    dependents: row.dependents ?? 0,
    primary_goal: row.primary_goal,
    goal_target_amount: row.goal_target_amount !== null
      ? Number(row.goal_target_amount)
      : null,
    goal_target_date: row.goal_target_date,
    goal_monthly_allocation: Number(row.goal_monthly_allocation) || 0,
    risk_tolerance: row.risk_tolerance !== null
      ? (row.risk_tolerance as RiskTolerance)
      : null,
    investment_experience: row.investment_experience !== null
      ? (row.investment_experience as InvestmentExperience)
      : null,
    profile_step_completed: (row.profile_step_completed ?? 0) as 0 | 1 | 2 | 3,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const financialProfileService = {
  /**
   * Fetch the user's financial profile.
   * Returns null if not configured, not found, or on error.
   */
  async fetchProfile(userId: string): Promise<FinancialProfile | null> {
    if (!isSupabaseConfigured || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('financial_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows — not an error, user just hasn't filled profile yet
        if (error.code === 'PGRST116') return null;
        console.warn('financialProfileService.fetchProfile:', error.message);
        return null;
      }

      if (!data) return null;
      return rowToProfile(data as FinancialProfileRow);
    } catch (err) {
      console.warn('financialProfileService.fetchProfile exception:', err);
      return null;
    }
  },

  /**
   * Upsert (create or update) financial profile fields.
   * Partial update — only provided fields are written.
   * Returns updated profile or null on failure.
   */
  async upsertProfile(
    userId: string,
    updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<FinancialProfile | null> {
    if (!isSupabaseConfigured || !userId) return null;

    try {
      const payload: Record<string, unknown> = { user_id: userId };

      if (updates.employment_status !== undefined)
        payload.employment_status = updates.employment_status;
      if (updates.monthly_income !== undefined)
        payload.monthly_income = updates.monthly_income;
      if (updates.income_stability !== undefined)
        payload.income_stability = updates.income_stability;
      if (updates.monthly_essential_expenses !== undefined)
        payload.monthly_essential_expenses = updates.monthly_essential_expenses;
      if (updates.monthly_debt_payments !== undefined)
        payload.monthly_debt_payments = updates.monthly_debt_payments;
      if (updates.emergency_fund !== undefined)
        payload.emergency_fund = updates.emergency_fund;
      if (updates.dependents !== undefined)
        payload.dependents = updates.dependents;
      if (updates.primary_goal !== undefined)
        payload.primary_goal = updates.primary_goal;
      if (updates.goal_target_amount !== undefined)
        payload.goal_target_amount = updates.goal_target_amount;
      if (updates.goal_target_date !== undefined)
        payload.goal_target_date = updates.goal_target_date;
      if (updates.goal_monthly_allocation !== undefined)
        payload.goal_monthly_allocation = updates.goal_monthly_allocation;
      if (updates.risk_tolerance !== undefined)
        payload.risk_tolerance = updates.risk_tolerance;
      if (updates.investment_experience !== undefined)
        payload.investment_experience = updates.investment_experience;
      if (updates.profile_step_completed !== undefined)
        payload.profile_step_completed = updates.profile_step_completed;

      const { data, error } = await supabase
        .from('financial_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.warn('financialProfileService.upsertProfile:', error.message);
        return null;
      }

      if (!data) return null;
      return rowToProfile(data as FinancialProfileRow);
    } catch (err) {
      console.warn('financialProfileService.upsertProfile exception:', err);
      return null;
    }
  },

  /**
   * Compute profile_step_completed from current profile state.
   * Step 1 complete: employment_status + monthly_income filled.
   * Step 2 complete: monthly_essential_expenses + emergency_fund filled.
   * Step 3 complete: primary_goal + goal_monthly_allocation filled.
   */
  computeStepCompleted(profile: Partial<FinancialProfile>): 0 | 1 | 2 | 3 {
    const step1 =
      profile.employment_status != null &&
      profile.monthly_income != null &&
      profile.monthly_income > 0;
    if (!step1) return 0;

    const step2 =
      profile.monthly_essential_expenses != null &&
      profile.monthly_essential_expenses > 0 &&
      profile.emergency_fund != null;
    if (!step2) return 1;

    const step3 =
      profile.primary_goal != null &&
      profile.primary_goal.trim().length > 0;
    return step3 ? 3 : 2;
  },
};
