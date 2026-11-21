import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { Tx } from '../../../models/types';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type TransactionRowItemProps = {
  tx: Tx;
  isLast?: boolean;
  onEdit?: (tx: Tx) => void;
  onDelete?: (tx: Tx) => void;
};

export const TransactionRowItem: React.FC<TransactionRowItemProps> = ({
  tx,
  isLast = false,
  onEdit,
  onDelete,
}) => {
  const { colors } = useThemeContext();

  const handleLongPress = () => {
    if (!onDelete) return;
    const msg = `Hapus "${tx.name}" sebesar Rp${tx.amount.toLocaleString('id-ID')} dan kembalikan mutasi ke saldo akun?`;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(msg)) {
        onDelete(tx);
      }
      return;
    }
    Alert.alert('Hapus Transaksi', msg, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => onDelete(tx),
      },
    ]);
  };

  const rowContent = (
    <View style={[styles.txRow, !isLast && [styles.txBorder, { borderBottomColor: colors.border }]]}>
      <CategoryIconBadge
        categoryOrType={tx.income ? 'Pemasukan' : tx.cat}
        size={36}
        iconSize={18}
        borderRadius={11}
      />
      <View style={{ flex: 1, paddingLeft: 4 }}>
        <Text style={[styles.txName, { color: colors.textPrimary }]}>{tx.name}</Text>
        <Text style={[styles.txMeta, { color: colors.textSecondary }]}>
          {tx.cat} · {tx.date}
        </Text>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: tx.income ? colors.incomeText : colors.expenseText },
        ]}
      >
        {tx.income ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
      </Text>
    </View>
  );

  if (!onDelete && !onEdit) {
    return rowContent;
  }

  return (
    <TouchableOpacity
      onPress={onEdit ? () => onEdit(tx) : undefined}
      onLongPress={onDelete ? handleLongPress : undefined}
      delayLongPress={380}
      activeOpacity={0.8}
    >
      {rowContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  txBorder: {
    borderBottomWidth: 1,
  },
  txName: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  txMeta: {
    fontFamily: FONT.regular,
    fontSize: 11,
    marginTop: 1,
  },
  txAmount: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
});
