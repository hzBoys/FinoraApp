/**
 * useFinancialProfile (P0.1)
 *
 * Controller hook for Financial Profile state management.
 * Loads from Supabase, exposes upsert, tracks loading state.
 * Follows AuthContext pattern — does NOT use useUserProfile (dead code).
 */

import { useCallback, useEffect, useState } from 'react';
import { FinancialProfile } from '../models/financialIntelligence';
import {
  financialProfileService,
} from '../services/db/financialProfileService';

export type UseFinancialProfileReturn = {
  /** null = not yet loaded or user has no profile yet */
  profile: FinancialProfile | null;
  isLoading: boolean;
  /** Save partial updates. Returns updated profile or null on failure. */
  saveProfile: (
    updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => Promise<FinancialProfile | null>;
  /** Reload from Supabase */
  reload: () => Promise<void>;
  /** True if step 1 (income) is complete */
  hasIncomeData: boolean;
  /** True if step 2 (expenses + emergency fund) is complete */
  hasSafetyData: boolean;
  /** True if minimum data for calculation engine is available */
  hasMinimumForCalculation: boolean;
};

export function useFinancialProfile(userId?: string | number): UseFinancialProfileReturn {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // userId must be a Supabase UUID string
  const resolvedUserId =
    typeof userId === 'string' && userId.includes('-') ? userId : null;

  const load = useCallback(async () => {
    if (!resolvedUserId) {
      setProfile(null);
      return;
    }
    setIsLoading(true);
    try {
      const fetched = await financialProfileService.fetchProfile(resolvedUserId);
      setProfile(fetched);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(
    async (
      updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    ): Promise<FinancialProfile | null> => {
      if (!resolvedUserId) return null;

      // Compute profile_step_completed from merged state
      const merged = { ...(profile ?? {}), ...updates };
      const stepCompleted = financialProfileService.computeStepCompleted(merged);
      const updatesWithStep = { ...updates, profile_step_completed: stepCompleted };

      const updated = await financialProfileService.upsertProfile(resolvedUserId, updatesWithStep);
      if (updated) setProfile(updated);
      return updated;
    },
    [resolvedUserId, profile]
  );

  const hasIncomeData =
    profile !== null &&
    profile.monthly_income !== null &&
    profile.monthly_income > 0;

  const hasSafetyData =
    profile !== null &&
    profile.monthly_essential_expenses !== null &&
    profile.monthly_essential_expenses > 0 &&
    profile.emergency_fund !== null;

  const hasMinimumForCalculation = hasIncomeData;

  return {
    profile,
    isLoading,
    saveProfile,
    reload: load,
    hasIncomeData,
    hasSafetyData,
    hasMinimumForCalculation,
  };
}
