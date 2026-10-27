import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { Ionicons } from '@expo/vector-icons';
import {
  buildDateResult,
  getDeviceNow,
  MONTH_NAMES,
  parseIsoOrDisplayDate,
  SelectedDateResult,
  SHORT_DAYS,
  SHORT_MONTHS,
} from '../../../utils/date';

type CalendarDatePickerModalProps = {
  selectedDate: string; // e.g. "27 Okt 2026" or "2026-10-27"
  onSelectDate: (result: SelectedDateResult) => void;
  onClose: () => void;
};

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const { colors, isDark } = useThemeContext();

  // Dynamic device today reference
  const now = useMemo(() => getDeviceNow(), []);
  const initialParsed = useMemo(() => parseIsoOrDisplayDate(selectedDate), [selectedDate]);

  const [year, setYear] = useState(initialParsed.year);
  const [monthIndex, setMonthIndex] = useState(initialParsed.monthIndex);
  const [activeDay, setActiveDay] = useState<number>(initialParsed.day);

  useEffect(() => {
    const p = parseIsoOrDisplayDate(selectedDate);
    setYear(p.year);
    setMonthIndex(p.monthIndex);
    setActiveDay(p.day);
  }, [selectedDate]);

  // Total days in currently viewed month
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Minggu

  // Active day details
  const activeResult = buildDateResult(year, monthIndex, Math.min(activeDay, totalDaysInMonth));
  const isTodayActive =
    activeResult.day === now.day &&
    activeResult.monthIndex === now.monthIndex &&
    activeResult.year === now.year;

  const handleConfirm = () => {
    const finalResult = buildDateResult(year, monthIndex, Math.min(activeDay, totalDaysInMonth));
    onSelectDate(finalResult);
    onClose();
  };

  const handlePickToday = () => {
    setYear(now.year);
    setMonthIndex(now.monthIndex);
    setActiveDay(now.day);
  };

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const emptyLeadingSlots = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <View style={styles.overlayBackdrop}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Header Preview */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {activeResult.dayName}, {activeResult.day} {MONTH_NAMES[monthIndex]}
            </Text>
            <View style={styles.subTitleRow}>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                {MONTH_NAMES[monthIndex]} {year}
              </Text>
              {isTodayActive && (
                <View
                  style={[
                    styles.todayBadge,
                    { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#DCFCE7' },
                  ]}
                >
                  <Text style={[styles.todayBadgeText, { color: isDark ? colors.secondary : '#15803D' }]}>
                    Hari ini
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Month Navigation & Quick "Hari Ini" Button */}
        <View style={styles.monthNavRow}>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? '#242426' : colors.surface,
                },
              ]}
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
              style={[
                styles.navBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? '#242426' : colors.surface,
                },
              ]}
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
                backgroundColor: isTodayActive
                  ? isDark
                    ? '#2D6A4F'
                    : colors.primary
                  : isDark
                  ? '#242426'
                  : colors.surface,
                borderColor: isTodayActive ? colors.secondary : colors.border,
              },
            ]}
            onPress={handlePickToday}
            activeOpacity={0.8}
          >
            <Ionicons
              name="today-outline"
              size={13}
              color={isTodayActive ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.quickTodayText,
                { color: isTodayActive ? '#FFFFFF' : colors.textSecondary },
                isTodayActive && { fontFamily: FONT.bold },
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
            const isToday =
              day === now.day && monthIndex === now.monthIndex && year === now.year;
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
              {
                borderColor: colors.border,
                backgroundColor: isDark ? '#242426' : colors.surface,
              },
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
              Pilih {isTodayActive ? 'Hari Ini' : `${activeResult.dayName}, ${activeResult.displayDate}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
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
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
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
  closeBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
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
    width: `${100 / 7}%`,
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
    height: 38,
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
