import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type CategorySpending = {
  key: string;
  label: string;
  budget: number;
  used: number;
  pct: number;
};

type BudgetProgressCardProps = {
  totalBudget: number;
  totalUsed: number;
  totalPct: number;
  totalRemaining: number;
  categorySpendings: CategorySpending[];
};

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  totalBudget,
  totalUsed: _totalUsed,
  totalPct,
  totalRemaining,
  categorySpendings,
}) => {
  const { colors } = useThemeContext();

  return (
    <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.budgetHeader}>
        <View>
          <Text style={[styles.budgetTotal, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>
            Rp{totalBudget.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.budgetSub, { color: colors.textSecondary }]}>Total anggaran bulan ini</Text>
        </View>
        <View
          style={[
            styles.budgetUsedBadge,
            { backgroundColor: colors.isDark ? 'rgba(82, 183, 136, 0.18)' : colors.mintBg },
          ]}
        >
          <Text
            style={[
              styles.budgetUsedText,
              { color: colors.isDark ? colors.secondary : colors.primary },
            ]}
          >
            {totalPct}% terpakai
          </Text>
        </View>
      </View>
      <View style={[styles.progressBg, { backgroundColor: colors.isDark ? '#2C2C2E' : colors.border }]}>
        <View style={[styles.progressFill, { width: `${Math.min(totalPct, 100)}%`, backgroundColor: colors.secondary }]} />
      </View>
      <Text style={[styles.budgetRemaining, { color: colors.textSecondary }]}>
        {totalBudget > 0
          ? `Sisa Rp${totalRemaining.toLocaleString('id-ID')} dari Rp${totalBudget.toLocaleString('id-ID')}`
          : 'Belum ada batas anggaran bulanan yang ditentukan'}
      </Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      {categorySpendings.map((cat) => (
        <View key={cat.label} style={styles.catRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CategoryIconBadge categoryOrType={cat.key} size={28} iconSize={14} borderRadius={8} />
            <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
          </View>
          <View style={styles.catRight}>
            <Text style={[styles.catAmount, { color: colors.textSecondary }]}>
              Rp{cat.used.toLocaleString('id-ID')}
            </Text>
            <Text
              style={[
                styles.catPct,
                { color: cat.pct >= 100 ? colors.expenseText : cat.pct >= 75 ? colors.warningText : colors.secondary },
              ]}
            >
              {cat.pct}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  whiteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  budgetTotal: {
    fontFamily: FONT.bold,
    fontSize: 20,
    fontWeight: '700',
  },
  budgetSub: {
    fontFamily: FONT.regular,
    fontSize: 11,
    marginTop: 2,
  },
  budgetUsedBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  budgetUsedText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  budgetRemaining: {
    fontFamily: FONT.regular,
    fontSize: 11,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  catLabel: {
    fontFamily: FONT.medium,
    fontSize: 13,
    fontWeight: '500',
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmount: {
    fontFamily: FONT.medium,
    fontSize: 13,
    fontWeight: '500',
  },
  catPct: {
    fontFamily: FONT.bold,
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
});
