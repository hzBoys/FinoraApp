/**
 * Financial Profile Modal (P0.1)
 * Progressive profiling — 3 steps. Each step independently saveable.
 * Step 1: Status + Income (required for calculation engine)
 * Step 2: Expenses, Debt, Emergency Fund, Dependents
 * Step 3: Goals (optional at P0)
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import {
  FinancialProfile,
  EmploymentStatus,
  IncomeStability,
} from '../../../models/financialIntelligence';
import { formatRupiahInput, parseRupiahInput } from '../../../utils/currency';

type FinancialProfileModalProps = {
  visible: boolean;
  currentProfile: FinancialProfile | null;
  isSaving: boolean;
  onSaveStep: (
    updates: Partial<Omit<FinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => Promise<void>;
  onClose: () => void;
  bottomSafeInset?: number;
};

const EMPLOYMENT_OPTIONS: { key: EmploymentStatus; label: string }[] = [
  { key: 'mahasiswa', label: 'Mahasiswa' },
  { key: 'karyawan', label: 'Karyawan' },
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'wirausaha', label: 'Wirausaha' },
  { key: 'lainnya', label: 'Lainnya' },
];

const STABILITY_OPTIONS: { key: IncomeStability; label: string; desc: string }[] = [
  { key: 'tetap', label: 'Tetap', desc: 'Gaji/pendapatan konsisten tiap bulan' },
  { key: 'relatif_stabil', label: 'Relatif Stabil', desc: 'Ada variasi kecil tiap bulan' },
  { key: 'fluktuatif', label: 'Fluktuatif', desc: 'Bervariasi signifikan tiap bulan' },
];

const GOAL_OPTIONS = [
  'Dana Darurat', 'Gadget / Laptop', 'Pendidikan',
  'Liburan', 'Modal Usaha', 'Investasi', 'Kendaraan', 'Lainnya',
];

export const FinancialProfileModal: React.FC<FinancialProfileModalProps> = ({
  visible,
  currentProfile,
  isSaving,
  onSaveStep,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(
    currentProfile?.profile_step_completed === 1
      ? 2
      : currentProfile?.profile_step_completed === 2
      ? 3
      : 1
  );
  const [error, setError] = useState('');

  // Initialize once per modal mount. App unmounts this component when closed.
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(
    currentProfile?.employment_status ?? 'lainnya'
  );
  const [incomeStr, setIncomeStr] = useState(
    currentProfile?.monthly_income ? formatRupiahInput(currentProfile.monthly_income) : ''
  );
  const [incomeStability, setIncomeStability] = useState<IncomeStability | null>(
    currentProfile?.income_stability ?? null
  );

  const [essentialExpStr, setEssentialExpStr] = useState(
    currentProfile?.monthly_essential_expenses
      ? formatRupiahInput(currentProfile.monthly_essential_expenses)
      : ''
  );
  const [debtStr, setDebtStr] = useState(
    currentProfile?.monthly_debt_payments
      ? formatRupiahInput(currentProfile.monthly_debt_payments)
      : ''
  );
  const [emergencyFundStr, setEmergencyFundStr] = useState(
    currentProfile?.emergency_fund ? formatRupiahInput(currentProfile.emergency_fund) : ''
  );
  const [dependents, setDependents] = useState(currentProfile?.dependents ?? 0);

  const [primaryGoal, setPrimaryGoal] = useState<string | null>(
    currentProfile?.primary_goal ?? null
  );
  const [goalAllocStr, setGoalAllocStr] = useState(
    currentProfile?.goal_monthly_allocation
      ? formatRupiahInput(currentProfile.goal_monthly_allocation)
      : ''
  );

  const handleSaveStep1 = async () => {
    setError('');
    const income = parseRupiahInput(incomeStr);
    if (income <= 0) {
      setError('Masukkan pendapatan bulanan yang valid.');
      return;
    }
    await onSaveStep({
      employment_status: employmentStatus,
      monthly_income: income,
      income_stability: incomeStability,
      profile_step_completed: 1,
    });
    setActiveStep(2);
  };

  const handleSaveStep2 = async () => {
    setError('');
    const essential = parseRupiahInput(essentialExpStr);
    if (essential <= 0) {
      setError('Masukkan pengeluaran pokok bulanan yang valid.');
      return;
    }
    const debt = parseRupiahInput(debtStr);
    const efund = parseRupiahInput(emergencyFundStr);

    await onSaveStep({
      monthly_essential_expenses: essential,
      monthly_debt_payments: debt,
      emergency_fund: efund > 0 ? efund : null,
      dependents,
      profile_step_completed: 2,
    });
    setActiveStep(3);
  };

  const handleSaveStep3 = async () => {
    setError('');
    const goalAlloc = parseRupiahInput(goalAllocStr);
    await onSaveStep({
      primary_goal: primaryGoal,
      goal_monthly_allocation: goalAlloc,
      profile_step_completed: 3,
    });
    onClose();
  };

  const stepLabel = activeStep === 1
    ? 'Pendapatan & Status'
    : activeStep === 2
    ? 'Pengeluaran & Keamanan'
    : 'Target Keuangan';

  const chipStyle = (active: boolean) => ({
    backgroundColor: active
      ? isDark ? '#2D6A4F' : colors.primary
      : isDark ? '#242426' : colors.surface,
    borderColor: active
      ? isDark ? colors.secondary : colors.primary
      : colors.border,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.primary }]}>
                Profil Finansial
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Langkah {activeStep} dari 3 — {stepLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {[1, 2, 3].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      activeStep === s
                        ? colors.secondary
                        : (currentProfile?.profile_step_completed ?? 0) >= s
                        ? colors.secondary
                        : colors.border,
                    opacity: (currentProfile?.profile_step_completed ?? 0) >= s || activeStep === s ? 1 : 0.4,
                  },
                ]}
                onPress={() => setActiveStep(s as 1 | 2 | 3)}
                disabled={(currentProfile?.profile_step_completed ?? 0) < s - 1}
              />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

            {/* ─── STEP 1 ─── */}
            {activeStep === 1 && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Status Pekerjaan *
                </Text>
                <View style={styles.chipGrid}>
                  {EMPLOYMENT_OPTIONS.map((opt) => {
                    const active = employmentStatus === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.chip, chipStyle(active)]}
                        onPress={() => setEmploymentStatus(opt.key)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Pendapatan Bulanan (Rp) *
                </Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Pendapatan rutin yang kamu terima tiap bulan (gaji, honor, dsb.)
                </Text>
                <View style={[styles.rupiahWrap, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.rupiahPrefix, { color: colors.textSecondary }]}>Rp</Text>
                  <TextInput
                    style={[styles.rupiahInput, { color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={incomeStr}
                    onChangeText={(t) => { setIncomeStr(formatRupiahInput(t)); setError(''); }}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Stabilitas Pendapatan
                </Text>
                {STABILITY_OPTIONS.map((opt) => {
                  const active = incomeStability === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.stabilityRow,
                        {
                          backgroundColor: active ? (isDark ? '#1C3D2F' : colors.mintBg) : (isDark ? '#242426' : colors.surface),
                          borderColor: active ? (isDark ? colors.secondary : colors.primary) : colors.border,
                        },
                      ]}
                      onPress={() => setIncomeStability(active ? null : opt.key)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stabilityLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                        <Text style={[styles.stabilityDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ─── STEP 2 ─── */}
            {activeStep === 2 && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Pengeluaran Pokok Bulanan (Rp) *
                </Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Estimasi total biaya makan, transportasi, tagihan, kebutuhan wajib — bukan cicilan.
                </Text>
                <View style={[styles.rupiahWrap, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.rupiahPrefix, { color: colors.textSecondary }]}>Rp</Text>
                  <TextInput
                    style={[styles.rupiahInput, { color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={essentialExpStr}
                    onChangeText={(t) => { setEssentialExpStr(formatRupiahInput(t)); setError(''); }}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Cicilan & Kewajiban Tetap Bulanan (Rp)
                </Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Total cicilan KPR, kendaraan, pinjaman, dsb. Isi 0 jika tidak ada.
                </Text>
                <View style={[styles.rupiahWrap, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.rupiahPrefix, { color: colors.textSecondary }]}>Rp</Text>
                  <TextInput
                    style={[styles.rupiahInput, { color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={debtStr}
                    onChangeText={(t) => setDebtStr(formatRupiahInput(t))}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Dana Darurat Saat Ini (Rp)
                </Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Total tabungan likuid yang kamu siapkan khusus untuk keadaan darurat.
                </Text>
                <View style={[styles.rupiahWrap, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.rupiahPrefix, { color: colors.textSecondary }]}>Rp</Text>
                  <TextInput
                    style={[styles.rupiahInput, { color: colors.textPrimary }]}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={emergencyFundStr}
                    onChangeText={(t) => setEmergencyFundStr(formatRupiahInput(t))}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Jumlah Tanggungan
                </Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface }]}
                    onPress={() => setDependents(Math.max(0, dependents - 1))}
                  >
                    <Text style={[styles.counterBtnText, { color: colors.textPrimary }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{dependents}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface }]}
                    onPress={() => setDependents(dependents + 1)}
                  >
                    <Text style={[styles.counterBtnText, { color: colors.textPrimary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ─── STEP 3 ─── */}
            {activeStep === 3 && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Target Keuangan Utama (opsional)
                </Text>
                <View style={styles.chipGrid}>
                  {GOAL_OPTIONS.map((g) => {
                    const active = primaryGoal === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.chip, chipStyle(active)]}
                        onPress={() => setPrimaryGoal(active ? null : g)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {primaryGoal && (
                  <>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      Alokasi Bulanan untuk Target Ini (Rp)
                    </Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                      Berapa yang ingin kamu sisihkan tiap bulan untuk mencapai target ini.
                    </Text>
                    <View style={[styles.rupiahWrap, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.rupiahPrefix, { color: colors.textSecondary }]}>Rp</Text>
                      <TextInput
                        style={[styles.rupiahInput, { color: colors.textPrimary }]}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={goalAllocStr}
                        onChangeText={(t) => setGoalAllocStr(formatRupiahInput(t))}
                      />
                    </View>
                  </>
                )}

                <View style={[styles.infoBox, { backgroundColor: isDark ? '#1C3D2F' : colors.mintBg, borderColor: isDark ? colors.secondary : colors.mintBorder }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.secondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Target ini membantu Finora menghitung alokasi yang lebih akurat. Kamu bisa ubah kapan saja.
                  </Text>
                </View>
              </>
            )}

            {/* Error */}
            {error ? (
              <Text style={[styles.errorText, { color: colors.expenseText }]}>{error}</Text>
            ) : null}

            {/* Actions */}
            <View style={styles.actionsRow}>
              {activeStep > 1 && (
                <TouchableOpacity
                  style={[styles.backBtn, { borderColor: colors.border, backgroundColor: isDark ? '#242426' : colors.surface }]}
                  onPress={() => setActiveStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
                >
                  <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Kembali</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: isDark ? '#2D6A4F' : colors.primary, flex: activeStep > 1 ? 2 : 1 },
                ]}
                onPress={
                  activeStep === 1 ? handleSaveStep1
                    : activeStep === 2 ? handleSaveStep2
                    : handleSaveStep3
                }
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving
                    ? 'Menyimpan...'
                    : activeStep === 3
                    ? 'Selesai'
                    : 'Simpan & Lanjut'}
                </Text>
              </TouchableOpacity>
            </View>

            {activeStep < 3 && (
              <TouchableOpacity onPress={onClose} style={{ alignSelf: 'center', marginTop: 8 }}>
                <Text style={[styles.skipText, { color: colors.textMuted }]}>
                  Lewati — isi nanti
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title: { fontFamily: FONT.bold, fontSize: 18, fontWeight: '700' },
  subtitle: { fontFamily: FONT.regular, fontSize: 12, marginTop: 2 },
  closeIcon: { fontSize: 18, padding: 6 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stepDot: { width: 28, height: 6, borderRadius: 3 },
  body: { paddingBottom: 16 },
  label: { fontFamily: FONT.medium, fontSize: 12, fontWeight: '500', marginTop: 14, marginBottom: 6 },
  hint: { fontFamily: FONT.regular, fontSize: 11, marginBottom: 6, lineHeight: 16 },
  rupiahWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
  },
  rupiahPrefix: { fontFamily: FONT.bold, fontSize: 15, marginRight: 8 },
  rupiahInput: { flex: 1, fontFamily: FONT.bold, fontSize: 16, letterSpacing: 0.5 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontFamily: FONT.semiBold, fontSize: 13 },
  stabilityRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  stabilityLabel: { fontFamily: FONT.semiBold, fontSize: 13, fontWeight: '600' },
  stabilityDesc: { fontFamily: FONT.regular, fontSize: 11, marginTop: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  counterBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontFamily: FONT.bold, fontSize: 20, lineHeight: 24 },
  counterValue: { fontFamily: FONT.bold, fontSize: 22, minWidth: 32, textAlign: 'center' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 16,
  },
  infoText: { fontFamily: FONT.regular, fontSize: 12, flex: 1, lineHeight: 18 },
  errorText: { fontFamily: FONT.semiBold, fontSize: 12, marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  backBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontFamily: FONT.semiBold, fontSize: 14 },
  saveBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: FONT.bold, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  skipText: { fontFamily: FONT.regular, fontSize: 12 },
});
