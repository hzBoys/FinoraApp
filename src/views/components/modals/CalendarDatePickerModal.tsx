import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

type CalendarDatePickerModalProps = {
  visible: boolean;
  selectedDate: string; // e.g. "26 Okt" or "Senin, 26 Okt"
  onSelectDate: (formattedDate: string, dayName: string) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  // Reference year & month (Oktober 2026)
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(9); // 9 = Oktober (0-indexed)

  const todayReal = 26; // 26 Oktober 2026 (Senin)
  const initialDay = parseInt(selectedDate.replace(/[^0-9]/g, ''), 10) || todayReal;
  const [activeDay, setActiveDay] = useState<number>(initialDay);

  useEffect(() => {
    if (visible) {
      const parsed = parseInt(selectedDate.replace(/[^0-9]/g, ''), 10);
      setActiveDay(isNaN(parsed) || parsed < 1 || parsed > 31 ? todayReal : parsed);
    }
  }, [visible, selectedDate]);

  // Number of days in the month
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Minggu, 4 = Kamis

  // Calculate day name of activeDay
  const activeDateObj = new Date(year, monthIndex, activeDay);
  const activeDayName = DAY_NAMES[activeDateObj.getDay()];
  const isTodaySelected = activeDay === todayReal && monthIndex === 9 && year === 2026;

  const handleConfirm = () => {
    // Returns formatted string e.g. "Senin, 26 Okt"
    onSelectDate(`${activeDay} ${SHORT_MONTHS[monthIndex]}`, activeDayName);
    onClose();
  };

  const handlePickToday = () => {
    setYear(2026);
    setMonthIndex(9);
    setActiveDay(todayReal);
  };

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const emptyLeadingSlots = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: bottomSafeInset + 16,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {activeDayName}, {activeDay} {MONTH_NAMES[monthIndex]}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                  {MONTH_NAMES[monthIndex]} {year}
                </Text>
                {isTodaySelected && (
                  <View style={[styles.todayBadge, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#DCFCE7' }]}>
                    <Text style={[styles.todayBadgeText, { color: isDark ? colors.secondary : '#15803D' }]}>
                      Hari ini
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation & Quick "Hari Ini" Button */}
          <View style={styles.monthNavRow}>
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[styles.navBtn, { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface }]}
                onPress={() => {
                  if (monthIndex === 0) {
                    setMonthIndex(11);
                    setYear((y) => y - 1);
                  } else {
                    setMonthIndex((m) => m - 1);
                  }
                }}
              >
                <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
                {SHORT_MONTHS[monthIndex]} {year}
              </Text>
              <TouchableOpacity
                style={[styles.navBtn, { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface }]}
                onPress={() => {
                  if (monthIndex === 11) {
                    setMonthIndex(0);
                    setYear((y) => y + 1);
                  } else {
                    setMonthIndex((m) => m + 1);
                  }
                }}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.quickTodayBtn,
                {
                  backgroundColor: isTodaySelected
                    ? isDark ? '#2D6A4F' : colors.primary
                    : isDark ? '#242426' : colors.surface,
                  borderColor: isTodaySelected ? colors.secondary : colors.border,
                },
              ]}
              onPress={handlePickToday}
              activeOpacity={0.8}
            >
              <Ionicons
                name="today-outline"
                size={13}
                color={isTodaySelected ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.quickTodayText,
                  { color: isTodaySelected ? '#FFFFFF' : colors.textSecondary },
                  isTodaySelected && { fontFamily: FONT.bold },
                ]}
              >
                Hari Ini
              </Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekRow}>
            {SHORT_DAYS.map((d, idx) => (
              <Text
                key={d}
                style={[
                  styles.weekDayText,
                  { color: idx === 0 ? '#FF453A' : colors.textMuted },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {emptyLeadingSlots.map((slot) => (
              <View key={`empty-${slot}`} style={styles.daySlot} />
            ))}

            {daysArray.map((day) => {
              const isSelected = activeDay === day;
              const isToday = day === todayReal && monthIndex === 9 && year === 2026;
              const dayDate = new Date(year, monthIndex, day);
              const isSunday = dayDate.getDay() === 0;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.daySlot,
                    isSelected && {
                      backgroundColor: isDark ? '#2D6A4F' : colors.primary,
                      borderRadius: 18,
                    },
                    !isSelected && isToday && {
                      borderWidth: 1.5,
                      borderColor: colors.secondary,
                      borderRadius: 18,
                    },
                  ]}
                  onPress={() => setActiveDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isSunday
                          ? '#FF453A'
                          : colors.textPrimary,
                        fontFamily: isSelected || isToday ? FONT.bold : FONT.medium,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isDark ? '#2D6A4F' : colors.primary },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>
                Pilih {isTodaySelected ? 'Hari Ini' : `${activeDayName}, ${activeDay} ${SHORT_MONTHS[monthIndex]}`}
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    fontFamily: FONT.regular,
    fontSize: 12,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontFamily: FONT.bold,
    fontSize: 10,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: FONT.bold,
    fontSize: 13,
    minWidth: 70,
    textAlign: 'center',
  },
  quickTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickTodayText: {
    fontFamily: FONT.medium,
    fontSize: 11,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  daySlot: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
