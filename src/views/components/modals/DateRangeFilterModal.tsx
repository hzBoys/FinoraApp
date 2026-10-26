import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { LAYOUT } from '../../../constants/theme';

export type DateFilterType = 'all' | '7days' | '30days' | 'custom';

export type DateRangeValue = {
  type: DateFilterType;
  label: string;
  startDay?: number;
  endDay?: number;
};

type DateRangeFilterModalProps = {
  visible: boolean;
  currentRange: DateRangeValue;
  onApplyRange: (range: DateRangeValue) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

export const DateRangeFilterModal: React.FC<DateRangeFilterModalProps> = ({
  visible,
  currentRange,
  onApplyRange,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const [selectedType, setSelectedType] = useState<DateFilterType>(currentRange.type);
  const [startDay, setStartDay] = useState<number>(currentRange.startDay ?? 1);
  const [endDay, setEndDay] = useState<number>(currentRange.endDay ?? 18);

  const options: { type: DateFilterType; label: string; desc: string }[] = [
    { type: 'all', label: 'Semua Waktu (Default)', desc: 'Menampilkan seluruh riwayat transaksi' },
    { type: '7days', label: '7 Hari Terakhir', desc: 'Transaksi dalam rentang 1 minggu terakhir' },
    { type: '30days', label: '30 Hari Terakhir', desc: 'Transaksi dalam rentang 1 bulan penuh' },
    { type: 'custom', label: 'Rentang Kustom', desc: 'Tentukan tanggal awal dan tanggal akhir spesifik' },
  ];

  const handleApply = () => {
    let label = 'Semua Waktu';
    if (selectedType === '7days') label = '7 Hari Terakhir';
    if (selectedType === '30days') label = '30 Hari Terakhir';
    if (selectedType === 'custom') label = `${startDay}–${endDay} Okt`;

    onApplyRange({
      type: selectedType,
      label,
      startDay: selectedType === 'custom' ? startDay : undefined,
      endDay: selectedType === 'custom' ? endDay : undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomSafeInset + 20 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Filter Periode Tanggal</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsCol}>
            {options.map((opt) => {
              const active = selectedType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  style={[
                    styles.optRow,
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
                  onPress={() => setSelectedType(opt.type)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optLabel,
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
                    <Text style={[styles.optDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
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

          {/* Custom Range Sliders/Pickers */}
          {selectedType === 'custom' && (
            <View
              style={[
                styles.customRangeBox,
                {
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.customTitle, { color: colors.textPrimary }]}>Pilih Hari (Oktober 2026):</Text>
              <View style={styles.rangeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>Dari Tanggal:</Text>
                  <View style={styles.stepRow}>
                    <TouchableOpacity
                      style={[
                        styles.stepBtn,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => setStartDay((d) => Math.max(1, d - 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepValue, { color: colors.textPrimary }]}>{startDay} Okt</Text>
                    <TouchableOpacity
                      style={[
                        styles.stepBtn,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => setStartDay((d) => Math.min(endDay, d + 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>Sampai Tanggal:</Text>
                  <View style={styles.stepRow}>
                    <TouchableOpacity
                      style={[
                        styles.stepBtn,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => setEndDay((d) => Math.max(startDay, d - 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepValue, { color: colors.textPrimary }]}>{endDay} Okt</Text>
                    <TouchableOpacity
                      style={[
                        styles.stepBtn,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => setEndDay((d) => Math.min(31, d + 1))}
                    >
                      <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
              ]}
              onPress={handleApply}
            >
              <Text style={styles.applyText}>Terapkan Filter</Text>
            </TouchableOpacity>
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
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  optionsCol: {
    gap: 8,
    marginBottom: 14,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  optDesc: {
    fontFamily: FONT.regular,
    fontSize: 11,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  customRangeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  customTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: FONT.bold,
    fontSize: 16,
  },
  stepValue: {
    fontFamily: FONT.bold,
    fontSize: 13,
    minWidth: 50,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
  },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
