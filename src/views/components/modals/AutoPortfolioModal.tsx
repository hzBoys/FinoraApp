import React, { useEffect, useState } from 'react';
import {
  Image,
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
import { Account, AccountType } from '../../../models/types';
import { OCRBalanceResult } from '../../../services/ai/geminiPortfolioService';
import { AutoPortfolioMode, AutoPortfolioStep } from '../../../controllers/useAutoPortfolioScan';
import { formatRupiahInput, parseRupiahInput } from '../../../utils/currency';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

const PILLAR_OPTIONS: { key: AccountType; label: string }[] = [
  { key: 'bank', label: 'Bank' },
  { key: 'ewallet', label: 'E-Wallet' },
  { key: 'investasi', label: 'Investasi' },
];

const QUICK_ACCOUNT_PRESETS: { name: string; tipe: AccountType }[] = [
  { name: 'BCA', tipe: 'bank' },
  { name: 'Mandiri', tipe: 'bank' },
  { name: 'GoPay', tipe: 'ewallet' },
  { name: 'OVO', tipe: 'ewallet' },
  { name: 'Bibit', tipe: 'investasi' },
];

type AutoPortfolioModalProps = {
  visible: boolean;
  mode: AutoPortfolioMode;
  onChangeMode: (mode: AutoPortfolioMode) => void;
  step: AutoPortfolioStep;
  imageUri: string | null;
  extractedData: OCRBalanceResult | null;
  progress: number;
  accounts: Account[];
  onClose: () => void;
  onLaunchCamera: () => void;
  onPickGallery: () => void;
  onConfirmBalance: (namaAkun: string, tipe: AccountType, nominalSaldo: number) => void;
  bottomSafeInset?: number;
};

export const AutoPortfolioModal: React.FC<AutoPortfolioModalProps> = ({
  visible,
  mode,
  onChangeMode,
  step,
  imageUri,
  extractedData,
  progress,
  accounts,
  onClose,
  onLaunchCamera,
  onPickGallery,
  onConfirmBalance,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();

  // Review & Manual Management state
  const [namaAkun, setNamaAkun] = useState('BCA');
  const [tipe, setTipe] = useState<AccountType>('bank');
  const [saldoStr, setSaldoStr] = useState('');

  useEffect(() => {
    if (extractedData) {
      setNamaAkun(extractedData.nama_akun);
      setTipe(extractedData.tipe);
      setSaldoStr(formatRupiahInput(extractedData.saldo));
    }
  }, [extractedData]);

  useEffect(() => {
    if (visible && mode === 'manage' && step === 'idle') {
      const first = accounts[0];
      if (first) {
        setNamaAkun(first.nama_akun);
        setTipe(first.tipe);
        setSaldoStr(formatRupiahInput(first.saldo));
      } else {
        setNamaAkun('BCA');
        setTipe('bank');
        setSaldoStr('');
      }
    }
  }, [visible, mode]);

  const handleSelectExistingOrPreset = (targetName: string, targetTipe: AccountType) => {
    setNamaAkun(targetName);
    setTipe(targetTipe);
    const existing = accounts.find(
      (a) => a.nama_akun.trim().toLowerCase() === targetName.trim().toLowerCase()
    );
    setSaldoStr(existing ? formatRupiahInput(existing.saldo) : '');
  };

  const handleSave = () => {
    const cleanName = namaAkun.trim() || (tipe === 'ewallet' ? 'E-Wallet' : tipe === 'investasi' ? 'Investasi' : 'Bank');
    const num = parseRupiahInput(saldoStr);
    onConfirmBalance(cleanName, tipe, Math.max(0, num));
  };

  const getPillarLabel = (t: AccountType) =>
    t === 'ewallet' ? 'E-Wallet' : t === 'investasi' ? 'Investasi' : 'Bank';

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
              <Text style={[styles.title, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>
                {step === 'processing'
                  ? 'Memproses Screenshot Saldo...'
                  : step === 'review'
                  ? 'Review Saldo Auto-Portfolio'
                  : 'Auto-Portfolio & Kelola Akun'}
              </Text>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                {step === 'review'
                  ? 'Periksa nama akun, pilar, dan nominal sebelum sinkronisasi'
                  : 'Pindai screenshot m-Banking/E-Wallet atau kelola multi-akun'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtnContainer}
            >
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Tabs (only shown when not mid-OCR processing/review) */}
          {step === 'idle' && (
            <View
              style={[
                styles.segmentRow,
                {
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  mode === 'scan' && {
                    backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary,
                  },
                ]}
                onPress={() => onChangeMode('scan')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="scan-outline"
                  size={14}
                  color={mode === 'scan' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: mode === 'scan' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Scan Saldo AI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  mode === 'manage' && {
                    backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary,
                  },
                ]}
                onPress={() => onChangeMode('manage')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={mode === 'manage' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: mode === 'manage' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Kelola Akun ({accounts.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* MODE 1: SCAN SALDO AI (IDLE) */}
          {step === 'idle' && mode === 'scan' && (
            <View style={styles.body}>
              <View style={styles.actionButtonsCol}>
                <TouchableOpacity
                  style={[
                    styles.primaryPickBtn,
                    {
                      backgroundColor: colors.isDark ? '#1C4032' : '#F0FAF4',
                      borderColor: colors.isDark ? colors.secondary : '#B7E4C7',
                    },
                  ]}
                  onPress={onLaunchCamera}
                  activeOpacity={0.85}
                >
                  <View style={styles.appleSquircleCamera}>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pickBtnTitle,
                        { color: colors.isDark ? '#FFFFFF' : colors.primary },
                      ]}
                    >
                      Potret Layar Saldo via Kamera
                    </Text>
                    <Text style={[styles.pickBtnDesc, { color: colors.textSecondary }]}>
                      Arahkan kamera ke tampilan info saldo bank, e-wallet, atau investasi
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryPickBtn,
                    {
                      backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={onPickGallery}
                  activeOpacity={0.85}
                >
                  <View style={styles.appleSquircleGallery}>
                    <Ionicons name="images" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pickBtnTitle,
                        { color: colors.isDark ? '#FFFFFF' : colors.primary },
                      ]}
                    >
                      Unggah Screenshot Saldo
                    </Text>
                    <Text style={[styles.pickBtnDesc, { color: colors.textSecondary }]}>
                      Pilih screenshot m-Banking, GoPay, OVO, DANA, atau Bibit (JPEG/PNG ≤ 5 MB)
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PROCESSING OCR */}
          {step === 'processing' && (
            <View style={styles.processingWrap}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImageSmall} />
              ) : null}
              <Text style={[styles.processingTitle, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>
                Mengekstrak Saldo via Gemini AI...
              </Text>
              <Text style={[styles.processingSub, { color: colors.textSecondary }]}>
                Mengenali penyedia akun (Bank / E-Wallet / Investasi) dan membaca nominal saldo utama
              </Text>

              <View style={[styles.progressBarBg, { backgroundColor: colors.isDark ? '#2C2C2E' : colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.secondary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {progress}% — Orkestrasi AI Auto-Portfolio
              </Text>
            </View>
          )}

          {/* REVIEW HASIL SCAN ATAU MODE KELOLA MULTI-AKUN */}
          {(step === 'review' || (step === 'idle' && mode === 'manage')) && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {step === 'review' && imageUri && (
                <View
                  style={[
                    styles.receiptPreviewCard,
                    {
                      backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image source={{ uri: imageUri }} style={styles.receiptThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.badgeSuccess, { color: colors.incomeText }]}>
                      ✓ Saldo Terbaca AI
                      {extractedData?.processingTimeMs
                        ? ` (${(extractedData.processingTimeMs / 1000).toFixed(1)} dtk)`
                        : ''}
                    </Text>
                    <Text style={[styles.detectedText, { color: colors.textPrimary }]}>
                      Akun: {namaAkun} ({getPillarLabel(tipe)})
                    </Text>
                    {extractedData?.ringkasan_ocr ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.detectedText, { color: colors.textSecondary, marginTop: 2 }]}
                      >
                        {extractedData.ringkasan_ocr}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {mode === 'manage' && step === 'idle' && accounts.length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0 }]}>
                    Daftar Akun Portofolio Aktif (Ketuk untuk Ubah Saldo)
                  </Text>
                  <View
                    style={[
                      styles.accountListBox,
                      {
                        backgroundColor: colors.isDark ? '#242426' : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {accounts.map((acc, idx) => {
                      const isSelected =
                        acc.nama_akun.trim().toLowerCase() === namaAkun.trim().toLowerCase();
                      return (
                        <TouchableOpacity
                          key={String(acc.account_id)}
                          style={[
                            styles.accountRow,
                            idx < accounts.length - 1 && {
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                            },
                            isSelected && {
                              backgroundColor: colors.isDark
                                ? 'rgba(82,183,136,0.14)'
                                : 'rgba(20,56,44,0.06)',
                            },
                          ]}
                          onPress={() => handleSelectExistingOrPreset(acc.nama_akun, acc.tipe)}
                          activeOpacity={0.75}
                        >
                          <CategoryIconBadge
                            categoryOrType={acc.nama_akun}
                            size={28}
                            iconSize={14}
                            borderRadius={8}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.accountRowName, { color: colors.textPrimary }]}>
                              {acc.nama_akun}
                            </Text>
                            <Text style={[styles.accountRowType, { color: colors.textMuted }]}>
                              Pilar {getPillarLabel(acc.tipe)}
                            </Text>
                          </View>
                          <Text style={[styles.accountRowBalance, { color: colors.textPrimary }]}>
                            Rp{acc.saldo.toLocaleString('id-ID')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Pilih Cepat Penyedia Akun
              </Text>
              <View style={styles.catGrid}>
                {QUICK_ACCOUNT_PRESETS.map((preset) => {
                  const active =
                    namaAkun.trim().toLowerCase() === preset.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: active
                            ? colors.isDark
                              ? '#2D6A4F'
                              : colors.primary
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
                      onPress={() => handleSelectExistingOrPreset(preset.name, preset.tipe)}
                      activeOpacity={0.75}
                    >
                      <CategoryIconBadge
                        categoryOrType={preset.name}
                        size={20}
                        iconSize={11}
                        borderRadius={6}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          { color: active ? '#FFFFFF' : colors.textSecondary },
                          active && { fontFamily: FONT.bold },
                        ]}
                      >
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nama Akun (Bank / E-Wallet / Investasi) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.isDark ? '#242426' : colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={namaAkun}
                onChangeText={setNamaAkun}
                placeholder="Contoh: BCA, Mandiri, GoPay, OVO, Bibit..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Pilar Portofolio *</Text>
              <View style={styles.catGrid}>
                {PILLAR_OPTIONS.map((p) => {
                  const active = tipe === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: active
                            ? colors.isDark
                              ? '#2D6A4F'
                              : colors.primary
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
                      onPress={() => setTipe(p.key)}
                      activeOpacity={0.75}
                    >
                      <CategoryIconBadge
                        categoryOrType={p.label}
                        size={22}
                        iconSize={12}
                        borderRadius={6}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          { color: active ? '#FFFFFF' : colors.textSecondary },
                          active && { fontFamily: FONT.bold },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nominal Saldo Aktif (Rp) *
              </Text>
              <View
                style={[
                  styles.currencyInputWrap,
                  {
                    backgroundColor: colors.isDark ? '#242426' : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>Rp</Text>
                <TextInput
                  style={[styles.currencyInput, { color: colors.textPrimary }]}
                  value={saldoStr}
                  onChangeText={(t) => setSaldoStr(formatRupiahInput(t))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.isDark ? '#242426' : colors.surface,
                    },
                  ]}
                  onPress={onClose}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {step === 'review' ? 'Konfirmasi & Simpan' : 'Simpan Saldo Akun'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 14,
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
  closeBtnContainer: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    paddingBottom: 16,
  },
  actionButtonsCol: {
    gap: 12,
    paddingVertical: 8,
  },
  primaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  secondaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  appleSquircleCamera: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleSquircleGallery: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtnTitle: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  pickBtnDesc: {
    fontFamily: FONT.regular,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  chevron: {
    fontSize: 22,
  },
  processingWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  previewImageSmall: {
    width: 80,
    height: 100,
    borderRadius: 10,
    marginBottom: 16,
  },
  processingTitle: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  processingSub: {
    fontFamily: FONT.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
  },
  receiptPreviewCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  receiptThumb: {
    width: 50,
    height: 64,
    borderRadius: 8,
  },
  badgeSuccess: {
    fontFamily: FONT.bold,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  detectedText: {
    fontFamily: FONT.medium,
    fontSize: 12,
  },
  accountListBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  accountRowName: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  accountRowType: {
    fontFamily: FONT.regular,
    fontSize: 11,
  },
  accountRowBalance: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontFamily: FONT.bold,
    fontSize: 15,
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    fontFamily: FONT.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  catChipText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
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
