import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { AccountType } from '../../../models/types';
import { Ionicons } from '@expo/vector-icons';

type BalanceHeroCardProps = {
  totalBalance: number;
  pillars: Record<AccountType, number>;
};

export const BalanceHeroCard: React.FC<BalanceHeroCardProps> = ({
  totalBalance,
  pillars,
}) => {
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.balanceCard,
        {
          backgroundColor: colors.widgetBg,
          borderColor: colors.widgetBorder,
          borderWidth: colors.isDark ? 1 : 0,
        },
      ]}
    >
      {/* Decorative glows */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <View style={styles.balanceCardInner}>
        <Text style={[styles.balanceLabel, { color: colors.textOnDarkDim }]}>Total Saldo Portofolio</Text>
        <Text style={[styles.balanceAmount, { color: colors.textOnDark }]}>
          Rp{totalBalance.toLocaleString('id-ID')}
        </Text>

        {/* 3 Pillars */}
        <View style={styles.pillarsRow}>
          <View style={styles.pillar}>
            <View style={styles.pillarHeader}>
              <Ionicons name="business" size={13} color={colors.textOnDarkDim} />
              <Text style={[styles.pillarLabel, { color: colors.textOnDarkDim }]}>Bank</Text>
            </View>
            <Text style={[styles.pillarAmount, { color: colors.textOnDark }]}>
              Rp{(pillars.bank || 0).toLocaleString('id-ID')}
            </Text>
            <Text style={[styles.pillarSub, { color: colors.textOnDarkDim }]}>Rekening Utama</Text>
          </View>
          <View style={[styles.pillar, styles.pillarBorder]}>
            <View style={styles.pillarHeader}>
              <Ionicons name="wallet" size={13} color={colors.textOnDarkDim} />
              <Text style={[styles.pillarLabel, { color: colors.textOnDarkDim }]}>E-Wallet</Text>
            </View>
            <Text style={[styles.pillarAmount, { color: colors.textOnDark }]}>
              Rp{(pillars.ewallet || 0).toLocaleString('id-ID')}
            </Text>
            <Text style={[styles.pillarSub, { color: colors.textOnDarkDim }]}>Dompet Digital</Text>
          </View>
          <View style={[styles.pillar, styles.pillarBorder]}>
            <View style={styles.pillarHeader}>
              <Ionicons name="trending-up" size={13} color={colors.textOnDarkDim} />
              <Text style={[styles.pillarLabel, { color: colors.textOnDarkDim }]}>Investasi</Text>
            </View>
            <Text style={[styles.pillarAmount, { color: colors.textOnDark }]}>
              Rp{(pillars.investasi || 0).toLocaleString('id-ID')}
            </Text>
            <Text style={[styles.pillarSub, { color: colors.textOnDarkDim }]}>Portofolio Aset</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
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
    backgroundColor: 'rgba(82, 183, 136, 0.12)',
  },
  deco2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(82, 183, 136, 0.08)',
  },
  balanceCardInner: {
    padding: 20,
  },
  balanceLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: FONT.bold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  pillarsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  pillar: {
    flex: 1,
    paddingRight: 8,
  },
  pillarBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.12)',
    paddingLeft: 8,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  pillarLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  pillarAmount: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  pillarSub: {
    fontFamily: FONT.regular,
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
    opacity: 0.7,
  },
});
