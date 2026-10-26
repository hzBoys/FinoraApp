import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { LAYOUT } from '../../constants/theme';
import { FONT } from '../../constants/typography';
import { CategoryIconBadge } from '../components/icons/CategoryIconBadge';
import { Ionicons } from '@expo/vector-icons';

type BudgetCategoryItem = {
  key: string;
  label: string;
  budget: number;
  used: number;
  pct: number;
};

type BudgetScreenProps = {
  periode?: string;
  totalBudget: number;
  totalUsed: number;
  totalPct: number;
  totalRemaining: number;
  unallocated: number;
  categorySpendings: BudgetCategoryItem[];
  nearLimitCategories: BudgetCategoryItem[];
  onOpenSetBudget?: () => void;
  bottomSafeInset?: number;
};

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  periode = 'Oktober 2026',
  totalBudget,
  totalUsed,
  totalPct,
  totalRemaining,
  unallocated,
  categorySpendings,
  nearLimitCategories,
  onOpenSetBudget,
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
      {/* Header Info */}
      <View style={styles.periodRow}>
        <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>{periode}</Text>
      </View>

      {/* Kartu Ringkasan Total Anggaran */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.widgetBg,
            borderColor: colors.widgetBorder,
            borderWidth: colors.isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.deco1} />
        <View style={styles.deco2} />
        <View style={styles.summaryInner}>
          <Text style={[styles.summaryBudgetLabel, { color: colors.textOnDarkDim }]}>Total Anggaran</Text>
          <Text style={[styles.summaryBudget, { color: colors.textOnDark }]}>
            Rp{totalBudget.toLocaleString('id-ID')}
          </Text>
          <View style={[styles.progressBg, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(196,235,217,0.2)' }]}>
            <View style={[styles.progressFill, { width: `${Math.min(totalPct, 100)}%`, backgroundColor: colors.secondary }]} />
          </View>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryUsedLabel, { color: colors.textOnDarkDim }]}>Terpakai</Text>
              <Text style={[styles.summaryUsed, { color: colors.textOnDark }]}>
                Rp{totalUsed.toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={[styles.pctBadge, { backgroundColor: colors.isDark ? 'rgba(82,183,136,0.25)' : 'rgba(196,235,217,0.2)' }]}>
              <Text style={[styles.pctBadgeText, { color: colors.textOnDark }]}>{totalPct}%</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryUsedLabel, { color: colors.textOnDarkDim }]}>Sisa</Text>
              <Text style={[styles.summarySisa, { color: colors.textOnDark }]}>
                Rp{totalRemaining.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Button Atur Batas Anggaran */}
      {onOpenSetBudget && (
        <TouchableOpacity
          style={[
            styles.setBudgetBtn,
            { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
          ]}
          onPress={onOpenSetBudget}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.setBudgetBtnText}>Atur Batas Anggaran</Text>
        </TouchableOpacity>
      )}

      {/* Rincian Kategori */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Per Kategori Anggaran</Text>
      <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {categorySpendings.map((cat, i) => {
          const warn = cat.pct >= 75;
          const over = cat.pct >= 100;
          const barColor = over ? colors.expenseText : warn ? colors.warningText : colors.secondary;
          return (
            <View
              key={cat.key}
              style={[
                styles.catItem,
                i < categorySpendings.length - 1 && [styles.catBorder, { borderBottomColor: colors.border }],
              ]}
            >
              <View style={styles.catHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CategoryIconBadge categoryOrType={cat.key} size={28} iconSize={14} borderRadius={8} />
                  <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
                </View>
                <Text style={[styles.catPct, { color: barColor }]}>
                  {cat.pct}%
                </Text>
              </View>
              <View style={[styles.catBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.catBarFill, { width: `${Math.min(cat.pct, 100)}%`, backgroundColor: barColor }]} />
              </View>
              <View style={styles.catAmounts}>
                <Text style={[styles.catUsed, { color: colors.textPrimary }]}>
                  Rp{cat.used.toLocaleString('id-ID')} terpakai
                </Text>
                <Text style={[styles.catBudget, { color: colors.textMuted }]}>
                  dari limit Rp{cat.budget.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Belum Dialokasikan */}
      {unallocated > 0 && (
        <View style={[styles.unallocCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.unallocText, { color: colors.textSecondary }]}>
            Rp{unallocated.toLocaleString('id-ID')} dana cadangan belum dialokasikan ke pos kategori.
          </Text>
        </View>
      )}

      {/* Tips / Advisor Alert */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Peringatan Anggaran</Text>
      <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {nearLimitCategories.length === 0 ? (
          <Text style={[styles.tipText, { color: totalBudget === 0 ? colors.textMuted : colors.incomeText }]}>
            {totalBudget === 0
              ? 'Belum ada alokasi anggaran yang ditetapkan untuk bulan ini.'
              : 'Seluruh pos anggaran Anda masih dalam batas aman terkendali.'}
          </Text>
        ) : (
          nearLimitCategories.map((cat) => (
            <View key={cat.key} style={styles.tipRow}>
              <CategoryIconBadge
                categoryOrType={cat.pct >= 100 ? 'Alert' : 'Warning'}
                size={24}
                iconSize={12}
                borderRadius={6}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{cat.label}</Text>
                {cat.pct >= 100
                  ? ` telah melebihi batas 100%!`
                  : ` sudah ${cat.pct}% — rem pengeluaran Anda.`}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingTop: 12,
    gap: 12,
  },
  periodRow: {
    alignItems: 'flex-end',
  },
  periodLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  deco1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(82,183,136,0.15)',
  },
  deco2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(196,235,217,0.08)',
  },
  summaryInner: {
    padding: 20,
  },
  summaryBudgetLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(196,235,217,0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryBudget: {
    fontFamily: FONT.bold,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(196,235,217,0.2)',
    marginBottom: 12,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryUsedLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(196,235,217,0.7)',
    marginBottom: 2,
  },
  summaryUsed: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySisa: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pctBadge: {
    backgroundColor: 'rgba(196,235,217,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pctBadgeText: {
    fontFamily: FONT.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    padding: 16,
  },
  catItem: {
    paddingVertical: 12,
  },
  catBorder: {
    borderBottomWidth: 1,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  catPct: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  catBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  catBarFill: {
    height: 6,
    borderRadius: 3,
  },
  catAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catUsed: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  catBudget: {
    fontFamily: FONT.regular,
    fontSize: 11,
  },
  unallocCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  unallocText: {
    fontFamily: FONT.regular,
    fontSize: 12,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    fontFamily: FONT.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  setBudgetBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginBottom: 4,
  },
  setBudgetBtnText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
