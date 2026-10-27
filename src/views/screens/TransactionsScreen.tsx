import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { LAYOUT } from '../../constants/theme';
import { FONT } from '../../constants/typography';
import { Tx } from '../../models/types';
import { TransactionRowItem } from '../components/transactions/TransactionRowItem';
import { CategoryIconBadge } from '../components/icons/CategoryIconBadge';
import { DateRangeFilterModal, DateRangeValue } from '../components/modals/DateRangeFilterModal';
import { parseIsoOrDisplayDate } from '../../utils/date';
import { Ionicons } from '@expo/vector-icons';

const FILTER_CATS = ['Semua', 'Pemasukan', 'Makan', 'Belanja', 'Transportasi', 'Tagihan', 'Transfer'];

type TransactionsScreenProps = {
  transactions: Tx[];
  query: string;
  onChangeQuery: (q: string) => void;
  activeCat: string;
  onSelectCat: (c: string) => void;
  totalIn: number;
  totalOut: number;
  bottomSafeInset?: number;
};

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  query,
  onChangeQuery,
  activeCat,
  onSelectCat,
  totalIn: _totalIn,
  totalOut: _totalOut,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();

  // Date Filter State
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    type: 'all',
    label: 'Semua Waktu',
  });

  // Filter transactions based on dynamic date range
  const dateFilteredTransactions = useMemo(() => {
    if (dateRange.type === 'all') return transactions;

    const now = new Date();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime();

    return transactions.filter((tx) => {
      const parsed = parseIsoOrDisplayDate(tx.date);
      const txTime = new Date(parsed.year, parsed.monthIndex, parsed.day).getTime();

      if (dateRange.type === '7days') {
        const sevenDaysAgo = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7,
          0,
          0,
          0,
          0
        ).getTime();
        return txTime >= sevenDaysAgo && txTime <= endOfToday;
      }

      if (dateRange.type === '30days') {
        const thirtyDaysAgo = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 30,
          0,
          0,
          0,
          0
        ).getTime();
        return txTime >= thirtyDaysAgo && txTime <= endOfToday;
      }

      if (dateRange.type === 'custom' && dateRange.startDay && dateRange.endDay) {
        const targetYear = dateRange.year ?? now.getFullYear();
        const targetMonth = dateRange.monthIndex ?? now.getMonth();
        const startTime = new Date(targetYear, targetMonth, dateRange.startDay, 0, 0, 0, 0).getTime();
        const endTime = new Date(targetYear, targetMonth, dateRange.endDay, 23, 59, 59, 999).getTime();
        return txTime >= startTime && txTime <= endTime;
      }

      return true;
    });
  }, [transactions, dateRange]);

  const totalFilteredIn = useMemo(
    () => dateFilteredTransactions.filter((t) => t.income).reduce((s, t) => s + t.amount, 0),
    [dateFilteredTransactions]
  );

  const totalFilteredOut = useMemo(
    () => dateFilteredTransactions.filter((t) => !t.income).reduce((s, t) => s + t.amount, 0),
    [dateFilteredTransactions]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Ringkasan Arus Kas Masuk / Keluar */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.incomeBg, borderColor: colors.incomeBorder }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pemasukan Terfilter</Text>
          <Text style={[styles.summaryAmountIn, { color: colors.incomeText }]}>
            Rp{totalFilteredIn.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>Periode: {dateRange.label}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.expenseBg, borderColor: colors.expenseBorder }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pengeluaran Terfilter</Text>
          <Text style={[styles.summaryAmountOut, { color: colors.expenseText }]}>
            Rp{totalFilteredOut.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>Termasuk mutasi internal</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Cari nama transaksi atau kategori..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={onChangeQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onChangeQuery('')}>
            <Text style={[styles.searchClear, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Filter Pill Button */}
      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          style={[
            styles.dateFilterBtn,
            {
              backgroundColor: colors.card,
              borderColor: dateRange.type !== 'all' ? colors.secondary : colors.border,
            },
          ]}
          onPress={() => setIsDateFilterModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={dateRange.type !== 'all' ? colors.secondary : colors.textMuted}
          />
          <Text style={[styles.dateFilterText, { color: colors.textPrimary }]}>
            Filter:{' '}
            <Text
              style={{
                fontFamily: FONT.bold,
                color: colors.isDark ? colors.secondary : colors.primary,
              }}
            >
              {dateRange.label}
            </Text>
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Filter Kategori Chips (Fixed height & no clipping) */}
      <View style={styles.filterScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_CATS.map((cat) => {
            const active = activeCat === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? colors.isDark
                        ? '#2D6A4F'
                        : colors.primary
                      : colors.card,
                    borderColor: active
                      ? colors.isDark
                        ? colors.secondary
                        : colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => onSelectCat(cat)}
                activeOpacity={0.7}
              >
                <CategoryIconBadge categoryOrType={cat} size={22} iconSize={12} borderRadius={6} />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                    active && { fontFamily: FONT.bold },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Daftar Mutasi */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: LAYOUT.tabHeight + bottomSafeInset + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {dateFilteredTransactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={44} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Tidak ada transaksi pada filter ini.
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {dateFilteredTransactions.map((tx, i) => (
              <TransactionRowItem
                key={tx.id}
                tx={tx}
                isLast={i === dateFilteredTransactions.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Date Range Modal */}
      <DateRangeFilterModal
        visible={isDateFilterModalOpen}
        currentRange={dateRange}
        onApplyRange={setDateRange}
        onClose={() => setIsDateFilterModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: LAYOUT.screenGutter,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  summaryLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmountIn: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryAmountOut: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  summarySub: {
    fontFamily: FONT.regular,
    fontSize: 10,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: LAYOUT.screenGutter,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  searchClear: {
    fontFamily: FONT.medium,
    fontSize: 14,
    paddingLeft: 8,
  },
  dateFilterContainer: {
    paddingHorizontal: LAYOUT.screenGutter,
    marginBottom: 8,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateFilterText: {
    flex: 1,
    fontFamily: FONT.medium,
    fontSize: 12,
  },
  filterScrollWrap: {
    height: 44,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: LAYOUT.screenGutter,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingTop: 4,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: FONT.regular,
    fontSize: 14,
  },
});
