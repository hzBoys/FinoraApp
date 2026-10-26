import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { TabKey } from '../../../models/types';
import { Ionicons } from '@expo/vector-icons';

type TabConfig = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // Apple vibrant tint
};

export const TABS: TabConfig[] = [
  {
    key: 'home',
    label: 'Beranda',
    icon: 'home',
    color: '#34C759', // Apple Green
  },
  {
    key: 'transactions',
    label: 'Transaksi',
    icon: 'receipt',
    color: '#007AFF', // Apple Blue
  },
  {
    key: 'budget',
    label: 'Anggaran',
    icon: 'pie-chart',
    color: '#FF9500', // Apple Orange
  },
  {
    key: 'profile',
    label: 'Profil',
    icon: 'person',
    color: '#AF52DE', // Apple Purple
  },
];

type BottomTabBarProps = {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  bottomSafeInset?: number;
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomSafeInset,
          height: LAYOUT.tabHeight + bottomSafeInset,
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            {/* Apple-style Colorful Squircle Badge */}
            <View
              style={[
                styles.iconSquircle,
                {
                  backgroundColor: active
                    ? tab.color
                    : isDark
                    ? '#2C2C2E'
                    : '#E5E7EB',
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={active ? '#FFFFFF' : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active ? tab.color : colors.textMuted,
                  fontFamily: active ? FONT.bold : FONT.medium,
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconSquircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  tabLabel: {
    fontSize: 10,
  },
});
