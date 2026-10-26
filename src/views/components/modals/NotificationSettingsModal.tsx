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

type NotificationSettingsModalProps = {
  visible: boolean;
  preferences: NotificationPreferences;
  onSave: (newPrefs: NotificationPreferences) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

const TIME_OPTIONS = ['19:00', '20:00', '21:00'];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  preferences,
  onSave,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  const [dailyReminder, setDailyReminder] = useState(preferences.dailyReminder);
  const [reminderTime, setReminderTime] = useState(preferences.reminderTime || '20:00');
  const [budgetAlert, setBudgetAlert] = useState(preferences.budgetAlert);
  const [weeklyReport, setWeeklyReport] = useState(preferences.weeklyReport);
  const [smartAdvisorTips, setSmartAdvisorTips] = useState(preferences.smartAdvisorTips);

  useEffect(() => {
    if (visible) {
      setDailyReminder(preferences.dailyReminder);
      setReminderTime(preferences.reminderTime || '20:00');
      setBudgetAlert(preferences.budgetAlert);
      setWeeklyReport(preferences.weeklyReport);
      setSmartAdvisorTips(preferences.smartAdvisorTips);
    }
  }, [visible, preferences]);

  const handleSave = () => {
    const updated: NotificationPreferences = {
      dailyReminder,
      reminderTime,
      budgetAlert,
      weeklyReport,
      smartAdvisorTips,
    };
    onSave(updated);
    onClose();
    Alert.alert(
      'Pengaturan Tersimpan',
      'Preferensi notifikasi berhasil diperbarui dan tersinkronisasi ke akun Anda.'
    );
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
                Atur bagaimana Finora mengingatkan aktivitas keuangan Anda
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Setting 1: Daily Reminder */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <CategoryIconBadge categoryOrType="Notifikasi" size={32} iconSize={16} borderRadius={8} />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Pengingat Catat Harian
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Mengingatkan untuk mencatat pengeluaran harian
                </Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={setDailyReminder}
                trackColor={{ false: isDark ? '#2C2C2E' : '#E5E7EB', true: '#34C759' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Time selection sub-row if daily reminder enabled */}
            {dailyReminder && (
              <View
                style={[
                  styles.timeSubRow,
                  { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Pilih Jam Pengingat:</Text>
                <View style={styles.timeChipsRow}>
                  {TIME_OPTIONS.map((time) => {
                    const active = reminderTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: active
                              ? isDark
                                ? '#2D6A4F'
                                : colors.primary
                              : colors.card,
                            borderColor: active ? colors.secondary : colors.border,
                          },
                        ]}
                        onPress={() => setReminderTime(time)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: active ? '#FFFFFF' : colors.textPrimary },
                            active && { fontFamily: FONT.bold },
                          ]}
                        >
                          {time} WIB
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                  Beri peringatan saat pos pengeluaran &gt;= 75% atau 100%
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
  timeSubRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: -4,
    marginBottom: 8,
    gap: 8,
  },
  timeLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipText: {
    fontFamily: FONT.medium,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
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
