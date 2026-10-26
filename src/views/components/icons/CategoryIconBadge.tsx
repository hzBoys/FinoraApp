import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconConfig = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
};

// Apple-inspired vibrant iOS squircle color palette
const APPLE_ICON_MAP: Record<string, IconConfig> = {
  // Categories
  Makan: {
    name: 'restaurant',
    color: '#FF9500', // Apple Orange
  },
  Belanja: {
    name: 'bag-handle',
    color: '#AF52DE', // Apple Purple
  },
  Transportasi: {
    name: 'bus',
    color: '#007AFF', // Apple Blue
  },
  Tagihan: {
    name: 'flash',
    color: '#FFCC00', // Apple Yellow / Gold
  },
  Hiburan: {
    name: 'film',
    color: '#FF2D55', // Apple Pink
  },
  Pemasukan: {
    name: 'arrow-down',
    color: '#34C759', // Apple Green
  },
  Pengeluaran: {
    name: 'arrow-up',
    color: '#FF3B30', // Apple Red
  },
  Transfer: {
    name: 'swap-horizontal',
    color: '#5856D6', // Apple Indigo
  },

  // Financial Accounts
  Bank: {
    name: 'business',
    color: '#0A84FF', // Apple Cobalt
  },
  'E-Wallet': {
    name: 'wallet',
    color: '#30D158', // Apple Mint
  },
  Investasi: {
    name: 'trending-up',
    color: '#32ADE6', // Apple Cyan
  },
  Tunai: {
    name: 'cash',
    color: '#00C7BE', // Apple Teal
  },
  Semua: {
    name: 'grid',
    color: '#8E8E93', // Apple Slate Gray
  },

  // Settings & Menus
  Akun: {
    name: 'person',
    color: '#007AFF', // Apple Blue
  },
  Tema: {
    name: 'color-palette',
    color: '#AF52DE', // Apple Purple
  },
  Notifikasi: {
    name: 'notifications',
    color: '#FF3B30', // Apple Red
  },
  Privasi: {
    name: 'shield-checkmark',
    color: '#32ADE6', // Apple Cyan
  },
  PIN: {
    name: 'key',
    color: '#34C759', // Apple Green
  },
  Bantuan: {
    name: 'chatbubble-ellipses',
    color: '#30B0C7', // Apple Teal
  },
  Tentang: {
    name: 'information',
    color: '#8E8E93', // Apple Neutral Gray
  },

  // Indicators
  Advisor: {
    name: 'bulb',
    color: '#FFCC00', // Apple Yellow
  },
  Warning: {
    name: 'warning',
    color: '#FF9500', // Apple Orange
  },
  Alert: {
    name: 'alert-circle',
    color: '#FF3B30', // Apple Red
  },
};

type CategoryIconBadgeProps = {
  categoryOrType: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
};

export const CategoryIconBadge: React.FC<CategoryIconBadgeProps> = ({
  categoryOrType,
  size = 36,
  iconSize,
  borderRadius,
}) => {
  const config = APPLE_ICON_MAP[categoryOrType] ?? {
    name: 'pricetag',
    color: '#34C759',
  };

  // Apple iOS squircle ratio is ~22-24% of size
  const calculatedRadius = borderRadius ?? Math.round(size * 0.24);
  const calculatedIconSize = iconSize ?? Math.round(size * 0.52);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: calculatedRadius,
          backgroundColor: config.color,
        },
      ]}
    >
      <Ionicons name={config.name} size={calculatedIconSize} color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
});
