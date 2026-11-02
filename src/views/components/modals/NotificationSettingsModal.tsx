import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { NotificationPreferences } from '../../../models/types';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';
import { notificationService } from '../../../services/db/notificationService';
import { Ionicons } from '@expo/vector-icons';

type NotificationSettingsModalProps = {
  visible: boolean;
  preferences: NotificationPreferences;
  onSave: (newPrefs: NotificationPreferences) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

const QUICK_PRESETS = [
  { label: '08:00 (Pagi)', hour: 8, minute: 0 },
  { label: '13:00 (Siang)', hour: 13, minute: 0 },
  { label: '19:00 (Malam)', hour: 19, minute: 0 },
  { label: '20:30 (Malam)', hour: 20, minute: 30 },
  { label: '21:00 (Malam)', hour: 21, minute: 0 },
];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  preferences,
  onSave,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  const [dailyReminder, setDailyReminder] = useState(preferences.dailyReminder);
  const [budgetAlert, setBudgetAlert] = useState(preferences.budgetAlert);
  const [weeklyReport, setWeeklyReport] = useState(preferences.weeklyReport);
  const [smartAdvisorTips, setSmartAdvisorTips] = useState(preferences.smartAdvisorTips);

  // Parse hour & minute from "20:00"
  const initialParts = (preferences.reminderTime || '20:00').split(':');
  const [hour, setHour] = useState<number>(parseInt(initialParts[0], 10) || 20);
  const [minute, setMinute] = useState<number>(parseInt(initialParts[1], 10) || 0);

  useEffect(() => {
    if (visible) {
      setDailyReminder(preferences.dailyReminder);
      setBudgetAlert(preferences.budgetAlert);
      setWeeklyReport(preferences.weeklyReport);
      setSmartAdvisorTips(preferences.smartAdvisorTips);

      const parts = (preferences.reminderTime || '20:00').split(':');
      setHour(parseInt(parts[0], 10) || 20);
      setMinute(parseInt(parts[1], 10) || 0);
    }
  }, [visible, preferences]);

  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const adjustHour = (delta: number) => {
    setHour((prev) => {
      let next = prev + delta;
      if (next < 0) next = 23;
      if (next > 23) next = 0;
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    setMinute((prev) => {
      let next = prev + delta;
      if (next < 0) next = 55;
      if (next > 59) next = 0;
      return next;
    });
  };

  const handleSave = () => {
    const updated: NotificationPreferences = {
      dailyReminder,
      reminderTime: formattedTime,
      budgetAlert,
      weeklyReport,
      smartAdvisorTips,
    };
    onSave(updated);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: bottomSafeInset + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.primary }]}>
                Pengaturan Notifikasi
              </Text>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                Atur jadwal dan bagaimana Finora mengingatkan Anda di perangkat OS
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Setting 1: Daily Reminder Switch */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <CategoryIconBadge categoryOrType="Notifikasi" size={32} iconSize={16} borderRadius={8} />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Pengingat Catat Harian
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {dailyReminder ? `Aktif jam ${formattedTime} WIB setiap hari` : 'Nonaktif'}
                </Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: isDark ? '#2C2C2E' : '#E5E7EB', true: '#34C759' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Flexible Time Picker Container */}
            {dailyReminder && (
              <View
                style={[
                  styles.timePickerContainer,
                  { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.timeHeaderRow}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                    Atur Jam & Menit Pengingat:
                  </Text>
                  <Text style={[styles.timeWibText, { color: colors.secondary }]}>
                    WIB (Waktu Indonesia Barat)
                  </Text>
                </View>

                {/* Digital Clock Stepper Controls */}
                <View style={styles.digitalClockRow}>
                  {/* Hours Block */}
                  <View style={styles.timeBlock}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => adjustHour(1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-up" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={[styles.timeDisplayBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.timeDisplayText, { color: colors.textPrimary }]}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                      <Text style={[styles.unitSub, { color: colors.textMuted }]}>Jam</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => adjustHour(-1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Separator Colon */}
                  <Text style={[styles.clockColon, { color: colors.secondary }]}>:</Text>

                  {/* Minutes Block */}
                  <View style={styles.timeBlock}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => adjustMinute(5)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-up" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={[styles.timeDisplayBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.timeDisplayText, { color: colors.textPrimary }]}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                      <Text style={[styles.unitSub, { color: colors.textMuted }]}>Menit</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => adjustMinute(-5)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Presets */}
                <Text style={[styles.presetTitle, { color: colors.textMuted }]}>Pilihan Cepat:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {QUICK_PRESETS.map((preset) => {
                    const active = hour === preset.hour && minute === preset.minute;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: active
                              ? isDark
                                ? '#2D6A4F'
                                : colors.primary
                              : colors.card,
                            borderColor: active ? colors.secondary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setHour(preset.hour);
                          setMinute(preset.minute);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            { color: active ? '#FFFFFF' : colors.textSecondary },
                            active && { fontFamily: FONT.bold },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Setting 2: Budget Threshold Warning */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <CategoryIconBadge categoryOrType="Warning" size={32} iconSize={16} borderRadius={8} />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Peringatan Limit Anggaran
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Beri peringatan saat pos pengeluaran mendekati atau melewati limit
                </Text>
              </View>
              <Switch
                value={budgetAlert}
                onValueChange={setBudgetAlert}
                trackColor={{ false: isDark ? '#2C2C2E' : '#E5E7EB', true: '#34C759' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Setting 3: Weekly Summary Report */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <CategoryIconBadge categoryOrType="Investasi" size={32} iconSize={16} borderRadius={8} />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Laporan Mingguan
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Ringkasan evaluasi arus kas setiap Minggu malam
                </Text>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={setWeeklyReport}
                trackColor={{ false: isDark ? '#2C2C2E' : '#E5E7EB', true: '#34C759' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Setting 4: Smart Advisor Spending Tips */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <CategoryIconBadge categoryOrType="Advisor" size={32} iconSize={16} borderRadius={8} />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Tips Cerdas Smart Advisor
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Saran penghematan jika pos gaya hidup melebihi 20%
                </Text>
              </View>
              <Switch
                value={smartAdvisorTips}
                onValueChange={setSmartAdvisorTips}
                trackColor={{ false: isDark ? '#2C2C2E' : '#E5E7EB', true: '#34C759' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? '#242426' : colors.surface,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: isDark ? '#2D6A4F' : colors.primary },
                ]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Simpan Pengaturan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    fontFamily: FONT.regular,
    fontSize: 12,
    marginTop: 2,
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  body: {
    paddingBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  settingTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDesc: {
    fontFamily: FONT.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  timePickerContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -4,
    marginBottom: 10,
    gap: 10,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  timeWibText: {
    fontFamily: FONT.medium,
    fontSize: 11,
  },
  digitalClockRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  timeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 44,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayBox: {
    width: 72,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontFamily: FONT.bold,
    fontSize: 26,
    letterSpacing: 1,
  },
  unitSub: {
    fontSize: 9,
    fontFamily: FONT.medium,
    marginTop: -2,
  },
  clockColon: {
    fontFamily: FONT.bold,
    fontSize: 28,
    marginBottom: 14,
  },
  presetTitle: {
    fontFamily: FONT.medium,
    fontSize: 11,
    marginTop: 4,
  },
  presetsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontFamily: FONT.medium,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: FONT.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
