import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type CashFlowCardProps = {
  totalIn: number;
  totalOut: number;
};

export const CashFlowCard: React.FC<CashFlowCardProps> = ({ totalIn, totalOut }) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.cashRow}>
      <View
        style={[
          styles.cashCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={{ marginBottom: 8 }}>
          <CategoryIconBadge categoryOrType="Pemasukan" size={28} iconSize={14} borderRadius={7} />
        </View>
        <Text style={[styles.cashLabel, { color: colors.textSecondary }]}>Pemasukan</Text>
        <Text style={[styles.cashAmountIn, { color: colors.incomeText }]}>
          Rp{totalIn.toLocaleString('id-ID')}
        </Text>
        <Text style={[styles.cashSub, { color: colors.textMuted }]}>Gaji & pemasukan lain</Text>
      </View>

      <View
        style={[
          styles.cashCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={{ marginBottom: 8 }}>
          <CategoryIconBadge categoryOrType="Pengeluaran" size={28} iconSize={14} borderRadius={7} />
        </View>
        <Text style={[styles.cashLabel, { color: colors.textSecondary }]}>Pengeluaran</Text>
        <Text style={[styles.cashAmountOut, { color: colors.expenseText }]}>
          Rp{totalOut.toLocaleString('id-ID')}
        </Text>
        <Text style={[styles.cashSub, { color: colors.textMuted }]}>Konsumsi (excl. transfer)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cashRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cashCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cashLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  cashAmountIn: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  cashAmountOut: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  cashSub: {
    fontFamily: FONT.regular,
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
});
