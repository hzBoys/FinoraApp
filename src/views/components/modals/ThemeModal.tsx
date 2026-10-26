import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { ThemeMode } from '../../../models/types';
import { Ionicons } from '@expo/vector-icons';

type ThemeModalProps = {
  visible: boolean;
  currentMode: ThemeMode;
  onSelectMode: (mode: ThemeMode) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

export const ThemeModal: React.FC<ThemeModalProps> = ({
  visible,
  currentMode,
  onSelectMode,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();

  const options: {
    mode: ThemeMode;
    label: string;
    desc: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }[] = [
    {
      mode: 'light',
      label: 'Mode Terang (Light Mode)',
      desc: 'Warna latar Warm Alabaster yang bersih dan nyaman',
      icon: 'sunny',
      color: '#FF9500',
    },
    {
      mode: 'dark',
      label: 'Mode Gelap (Dark Mode)',
      desc: 'Warna Apple Dark Grey elegan dengan kombinasi Dark Green',
      icon: 'moon',
      color: '#5856D6',
    },
    {
      mode: 'system',
      label: 'Ikuti Sistem Perangkat',
      desc: 'Menyesuaikan otomatis dengan tema iOS/Android Anda',
      icon: 'settings',
      color: '#8E8E93',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: bottomSafeInset + 24,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>Tampilan Aplikasi</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            Pilih preferensi tema visual untuk kenyamanan penggunaan.
          </Text>

          <View style={styles.optionsList}>
            {options.map((opt) => {
              const active = currentMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: active
                        ? colors.isDark
                          ? '#1C3328'
                          : '#F0FAF4'
                        : colors.isDark
                        ? '#242426'
                        : colors.surface,
                      borderColor: active
                        ? colors.isDark
                          ? colors.secondary
                          : colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => {
                    onSelectMode(opt.mode);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themeSquircle, { backgroundColor: opt.color }]}>
                    <Ionicons name={opt.icon} size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: active
                            ? colors.isDark
                              ? colors.secondary
                              : colors.primary
                            : colors.textPrimary,
                        },
                        active && { fontFamily: FONT.bold },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: active
                          ? colors.isDark
                            ? colors.secondary
                            : colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    {active && (
                      <View
                        style={[
                          styles.radioDot,
                          {
                            backgroundColor: colors.isDark ? colors.secondary : colors.primary,
                          },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    fontFamily: FONT.regular,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  themeSquircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  optionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
  },
  optionDesc: {
    fontFamily: FONT.regular,
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
