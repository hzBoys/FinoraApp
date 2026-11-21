import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
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
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { Account } from '../../../models/types';
import {
  normalizeCategoryName,
  OCRReceiptResult,
} from '../../../controllers/services/magicReceiptService';
import { MagicReceiptStep } from '../../../controllers/useMagicReceipt';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';
import {
  getCurrentPeriodLabel,
  getDeviceNow,
  isDateInCurrentPeriod,
  parseIsoOrDisplayDate,
  SelectedDateResult,
} from '../../../utils/date';
import { formatRupiahInput, parseRupiahInput } from '../../../utils/currency';
import { Ionicons } from '@expo/vector-icons';

const EXPENSE_CATEGORIES = ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan'];

type MagicReceiptModalProps = {
  visible: boolean;
  step: MagicReceiptStep;
  isSaving?: boolean;
  imageUri: string | null;
  extractedData: OCRReceiptResult | null;
  progress: number;
  onClose: () => void;
  onLaunchCamera: () => void;
  onPickGallery: () => void;
  onConfirm: (
    merchant: string,
    nominal: number,
    kategori: string,
    tanggal: string,
    metodeBayar: string,
    accountId: number | string
  ) => Promise<boolean> | void;
  accounts?: Account[];
  bottomSafeInset?: number;
};

export const MagicReceiptModal: React.FC<MagicReceiptModalProps> = ({
  visible,
  step,
  isSaving = false,
  imageUri,
  extractedData,
  progress,
  onClose,
  onLaunchCamera,
  onPickGallery,
  onConfirm,
  accounts = [],
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const [merchant, setMerchant] = useState('');
  const [nominalStr, setNominalStr] = useState('');
  const [kategori, setKategori] = useState('Makan');
  const [dateInfo, setDateInfo] = useState<SelectedDateResult>(getDeviceNow());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [error, setError] = useState('');

  const accountList =
    accounts.length > 0
      ? accounts
      : [
          { account_id: 1, nama_akun: 'Bank', tipe: 'bank' as const, saldo: 0, user_id: 1, updated_at: '' },
          { account_id: 2, nama_akun: 'E-Wallet', tipe: 'ewallet' as const, saldo: 0, user_id: 1, updated_at: '' },
          { account_id: 3, nama_akun: 'Investasi', tipe: 'investasi' as const, saldo: 0, user_id: 1, updated_at: '' },
        ];

  const [selectedAccountId, setSelectedAccountId] = useState<number | string>(
    accountList[0]?.account_id ?? 1
  );

  useEffect(() => {
    if (extractedData) {
      setMerchant(extractedData.merchant);
      setNominalStr(formatRupiahInput(extractedData.nominal));
      const normalizedCat = normalizeCategoryName(extractedData.kategori, false);
      setKategori(EXPENSE_CATEGORIES.includes(normalizedCat) ? normalizedCat : 'Belanja');
      setDateInfo(parseIsoOrDisplayDate(extractedData.tanggal));
      setIsCalendarOpen(false);
      setError('');

      // Smart account matching: 1) Brand hint (GoPay/BCA/etc), 2) Pillar with balance > 0, 3) Pillar match
      const brandHint = (extractedData.detectedAccountHint || '').trim().toLowerCase();
      const brandMatch = brandHint
        ? accountList.find((a) => a.nama_akun.trim().toLowerCase() === brandHint)
        : undefined;

      if (brandMatch) {
        setSelectedAccountId(brandMatch.account_id);
        return;
      }

      const methodLower = (extractedData.metode_bayar || '').toLowerCase();
      const targetType = methodLower.includes('wallet')
        ? 'ewallet'
        : methodLower.includes('invest')
        ? 'investasi'
        : 'bank';
      const fundedPillarMatch = accountList.find((a) => a.tipe === targetType && a.saldo > 0);
      const anyPillarMatch = accountList.find((a) => a.tipe === targetType);
      const bestMatch = fundedPillarMatch ?? anyPillarMatch ?? accountList[0];
      if (bestMatch) {
        setSelectedAccountId(bestMatch.account_id);
      }
    }
  }, [extractedData, accounts]);

  useEffect(() => {
    if (accountList.length > 0 && !accountList.some((a) => a.account_id === selectedAccountId)) {
      setSelectedAccountId(accountList[0].account_id);
    }
  }, [visible, accounts]);

  const handleSave = () => {
    if (isSaving) return;
    const cleanMerchant = merchant.trim();
    if (!cleanMerchant) {
      setError('Nama merchant / toko wajib diisi.');
      return;
    }
    const num = parseRupiahInput(nominalStr);
    if (num <= 0) {
      setError('Nominal transaksi harus lebih besar dari Rp0.');
      return;
    }

    setError('');
    const acc = accountList.find((a) => a.account_id === selectedAccountId) ?? accountList[0];
    onConfirm(
      cleanMerchant,
      num,
      kategori,
      dateInfo.isoDate,
      acc?.nama_akun ?? 'Bank',
      acc?.account_id ?? selectedAccountId
    );
  };

  const outsideCurrentMonth = !isDateInCurrentPeriod(dateInfo.isoDate);
  const dateLabel = dateInfo.isToday
    ? `Hari ini (${dateInfo.dayName}), ${dateInfo.displayDate}`
    : dateInfo.fullDisplay;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
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
                    ? 'Memproses Struk (OCR)...'
                    : step === 'review'
                    ? 'Review Transaksi OCR'
                    : 'Pindai Struk Belanja'}
                </Text>
                {step === 'review' && (
                  <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                    Periksa data sebelum memotong saldo
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSaving}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtnContainer}
              >
                <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* STEP 1: SELECT CAMERA / GALLERY ONLY */}
            {step === 'idle' && (
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
                        Ambil Foto via Kamera
                      </Text>
                      <Text style={[styles.pickBtnDesc, { color: colors.textSecondary }]}>
                        Buka kamera ponsel dan potret struk fisik secara langsung
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
                        Pilih Gambar dari Galeri
                      </Text>
                      <Text style={[styles.pickBtnDesc, { color: colors.textSecondary }]}>
                        Unggah screenshot bukti pembayaran (format JPEG / PNG &le; 5 MB)
                      </Text>
                    </View>
                    <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 2: PROCESSING ANIMATION */}
            {step === 'processing' && (
              <View style={styles.processingWrap}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImageSmall} />
                ) : null}
                <Text style={[styles.processingTitle, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>
                  Mengekstrak Teks Struk via OCR...
                </Text>
                <Text style={[styles.processingSub, { color: colors.textSecondary }]}>
                  Membaca tanggal, nominal, nama merchant, dan mengkategorikan transaksi otomatis
                </Text>

                {/* Progress Bar */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.isDark ? '#2C2C2E' : colors.border }]}>
                  <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.secondary }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.secondary }]}>
                  {progress}% — Waktu Ekstraksi &lt; 2 detik
                </Text>
              </View>
            )}

            {/* STEP 3: REVIEW TRANSAKSI */}
            {step === 'review' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                {imageUri && (
                  <View style={[styles.receiptPreviewCard, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                    <Image source={{ uri: imageUri }} style={styles.receiptThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.badgeSuccess, { color: colors.incomeText }]}>
                        ✓ Struk Terbaca AI
                        {extractedData?.processingTimeMs
                          ? ` (${(extractedData.processingTimeMs / 1000).toFixed(1)} dtk)`
                          : ' (Akurasi > 90%)'}
                      </Text>
                      <Text style={[styles.detectedText, { color: colors.textPrimary }]}>Merchant: {merchant}</Text>
                      <Text style={[styles.detectedText, { color: colors.textSecondary }]}>
                        Tanggal: {dateInfo.displayDate}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Editable Fields */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Merchant / Toko *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={merchant}
                  onChangeText={(t) => {
                    setMerchant(t);
                    setError('');
                  }}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Nominal Ekstraksi (Rp) *</Text>
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
                    value={nominalStr}
                    onChangeText={(t) => {
                      setNominalStr(formatRupiahInput(t));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Editable Receipt Date + Active Month Guidance */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Tanggal Transaksi *</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerBtn,
                    {
                      backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      borderColor: outsideCurrentMonth ? colors.warningText : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsCalendarOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={outsideCurrentMonth ? colors.warningText : colors.isDark ? colors.secondary : colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                      {dateLabel}
                    </Text>
                  </View>
                  <Text style={[styles.changeDateText, { color: colors.secondary }]}>Ganti ›</Text>
                </TouchableOpacity>

                {outsideCurrentMonth && (
                  <View
                    style={[
                      styles.periodNoticeBox,
                      {
                        backgroundColor: colors.isDark ? 'rgba(255, 159, 10, 0.14)' : '#FFFBEB',
                        borderColor: colors.isDark ? 'rgba(255, 159, 10, 0.4)' : '#FCD34D',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.periodNoticeText, { color: colors.textPrimary }]}>
                        Struk bertanggal di luar bulan aktif ({getCurrentPeriodLabel()}). Arus Kas &amp; Anggaran di Beranda hanya menghitung transaksi bulan berjalan.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.useTodayBtn,
                        { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
                      ]}
                      onPress={() => setDateInfo(getDeviceNow())}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.useTodayBtnText}>Pakai Hari Ini</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori (Auto-Categorization AI)</Text>
                <View style={styles.catGrid}>
                  {EXPENSE_CATEGORIES.map((c) => {
                    const active = kategori === c;
                    return (
                      <TouchableOpacity
                        key={c}
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
                        onPress={() => setKategori(c)}
                        activeOpacity={0.7}
                      >
                        <CategoryIconBadge categoryOrType={c} size={22} iconSize={12} borderRadius={6} />
                        <Text
                          style={[
                            styles.catChipText,
                            { color: active ? '#FFFFFF' : colors.textSecondary },
                            active && { fontFamily: FONT.bold },
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Akun Pemotong Saldo */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Potong Dari Akun Saldo *</Text>
                <View style={styles.catGrid}>
                  {accountList.map((acc) => {
                    const active = selectedAccountId === acc.account_id;
                    return (
                      <TouchableOpacity
                        key={String(acc.account_id)}
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
                        onPress={() => setSelectedAccountId(acc.account_id)}
                        activeOpacity={0.7}
                      >
                        <CategoryIconBadge categoryOrType={acc.nama_akun} size={22} iconSize={12} borderRadius={6} />
                        <Text
                          style={[
                            styles.catChipText,
                            { color: active ? '#FFFFFF' : colors.textSecondary },
                            active && { fontFamily: FONT.bold },
                          ]}
                        >
                          {acc.nama_akun}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Action Buttons */}
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
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary,
                        opacity: isSaving ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.85}
                  >
                    {isSaving ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>Menyimpan...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitBtnText}>Konfirmasi &amp; Simpan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>

        {isCalendarOpen && (
          <CalendarDatePickerModal
            selectedDate={dateInfo.isoDate}
            onSelectDate={(result) => {
              setDateInfo(result);
              setIsCalendarOpen(false);
            }}
            onClose={() => setIsCalendarOpen(false)}
          />
        )}
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
  closeBtnContainer: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  appleSquircleGallery: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 14,
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
    marginBottom: 4,
  },
  detectedText: {
    fontFamily: FONT.medium,
    fontSize: 12,
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
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  datePickerText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
  },
  changeDateText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  periodNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodNoticeText: {
    fontFamily: FONT.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  useTodayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  useTodayBtnText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    color: '#FFFFFF',
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
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#C53030',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
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
