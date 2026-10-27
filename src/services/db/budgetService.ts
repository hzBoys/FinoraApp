import { supabase } from '../supabase';
import { Budget } from '../../models/types';
import { getCurrentPeriodKey } from '../../utils/date';

export const budgetService = {
  async fetchBudget(userId: string, periode: string): Promise<Budget | null> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('periode', periode)
        .single();

      if (error) {
        console.warn('budgetService.fetchBudget warning:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        budget_id: data.id,
        user_id: data.user_id,
        periode: data.periode,
        persen_kebutuhan: Number(data.persen_kebutuhan),
        persen_gaya_hidup: Number(data.persen_gaya_hidup),
        persen_tabungan: Number(data.persen_tabungan),
        total_anggaran: Number(data.total_anggaran),
      };
    } catch (err) {
      console.warn('budgetService.fetchBudget exception:', err);
      return null;
    }
  },

  async upsertBudget(userId: string, budget: Partial<Budget>): Promise<boolean> {
    try {
      const { error } = await supabase.from('budgets').upsert(
        {
          user_id: userId,
          periode: budget.periode || getCurrentPeriodKey(),
          total_anggaran: budget.total_anggaran || 3000000,
          persen_kebutuhan: budget.persen_kebutuhan || 60,
          persen_gaya_hidup: budget.persen_gaya_hidup || 20,
          persen_tabungan: budget.persen_tabungan || 20,
        },
        { onConflict: 'user_id,periode' }
      );

      if (error) {
        console.warn('budgetService.upsertBudget warning:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('budgetService.upsertBudget exception:', err);
      return false;
    }
  },
};
