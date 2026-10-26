import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { LAYOUT } from '../../constants/theme';
import { FONT } from '../../constants/typography';
import { AccountType, Tx } from '../../models/types';
import { AdvisorCard } from '../components/cards/AdvisorCard';
import { BalanceHeroCard } from '../components/cards/BalanceHeroCard';
import { BudgetProgressCard } from '../components/cards/BudgetProgressCard';
import { CashFlowCard } from '../components/cards/CashFlowCard';
import { TransactionRowItem } from '../components/transactions/TransactionRowItem';

type HomeScreenProps = {
  totalBalance: number;
  pillars: Record<AccountType, number>;
  totalIn: number;
  totalOut: number;
  totalBudget: number;
  totalUsed: number;
  totalPct: number;
  totalRemaining: number;
  categorySpendings: { key: string; label: string; budget: number; used: number; pct: number }[];
  advisorRecommendation: string;
  recentTransactions: Tx[];
  onOpenAddModal: () => void;
  onScanReceipt: () => void;
  bottomSafeInset?: number;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  totalBalance,
  pillars,
  totalIn,
  totalOut,
  totalBudget,
  totalUsed,
  totalPct,
  totalRemaining,
  categorySpendings,
  advisorRecommendation,
  recentTransactions,
  onOpenAddModal,
  onScanReceipt,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        {
          paddingBottom: LAYOUT.tabHeight + bottomSafeInset + 16,
          backgroundColor: colors.surface,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Balance Card */}
      <BalanceHeroCard totalBalance={totalBalance} pillars={pillars} />

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary }]}
          onPress={onOpenAddModal}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Catat Transaksi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnSecondary,
            {
              backgroundColor: colors.isDark ? '#1C1C1E' : colors.mintBg,
              borderColor: colors.isDark ? colors.border : colors.mintBorder,
            },
          ]}
          onPress={onScanReceipt}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.btnSecondaryText,
              { color: colors.isDark ? colors.secondary : colors.primary },
            ]}
          >
            Pindai Struk
          </Text>
        </TouchableOpacity>
      </View>

      {/* Arus Kas Bulan Ini */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Arus Kas Bulan Ini</Text>
      <CashFlowCard totalIn={totalIn} totalOut={totalOut} />

      {/* Anggaran Bulanan */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Anggaran Bulanan</Text>
      <BudgetProgressCard
        totalBudget={totalBudget}
        totalUsed={totalUsed}
        totalPct={totalPct}
        totalRemaining={totalRemaining}
        categorySpendings={categorySpendings}
      />

      {/* Smart Advisor */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Smart Advisor</Text>
      <AdvisorCard body={advisorRecommendation} />

      {/* Transaksi Terbaru */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Transaksi Terbaru</Text>
      <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {recentTransactions.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: colors.textMuted }}>
              Belum ada transaksi tercatat.
            </Text>
          </View>
        ) : (
          recentTransactions.map((tx, i, arr) => (
            <TransactionRowItem key={tx.id} tx={tx} isLast={i === arr.length - 1} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingTop: 16,
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONT.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: FONT.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  whiteCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
