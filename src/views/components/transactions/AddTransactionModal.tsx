import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { Account, Tx } from '../../../models/types';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';
import { CalendarDatePickerModal } from '../modals/CalendarDatePickerModal';
import { getDeviceNow, SelectedDateResult } from '../../../utils/date';
import { Ionicons } from '@expo/vector-icons';

const EXPENSE_CATS = ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Transfer'] as const;

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (tx: Tx) => void;
  accounts?: Account[];
  bottomSafeInset?: number;
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSave,
  accounts = [],
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [cat, setCat] = useState<string>('Makan');
  const [selectedAccountId, setSelectedAccountId] = useState<number | string>(
    accounts.length > 0 ? accounts[0].account_id : 1
  );

  // Dynamic device date
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
          { account_id: 4, nama_akun: 'Tunai', tipe: 'tunai' as const, saldo: 0, user_id: 1, updated_at: '' },
        ];

  const resetForm = () => {
    setName('');
    setAmountStr('');
    setIsIncome(false);
    setCat('Makan');
    setSelectedAccountId(accountList[0]?.account_id ?? 1);
    setDateInfo(getDeviceNow());
    setIsCalendarOpen(false);
    setError('');
  };

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama transaksi wajib diisi.');
      return;
    }
    const cleanAmount = amountStr.replace(/[^0-9]/g, '');
    const numAmount = Number(cleanAmount);
    if (!cleanAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Nominal harus berupa angka lebih besar dari 0.');
      return;
    }

    const selectedAccount = accountList.find((a) => a.account_id === selectedAccountId);

    const newTx: Tx = {
      id: Date.now(),
      name: trimmedName,
      date: dateInfo.isoDate, // Store accurate ISO date "YYYY-MM-DD"
      cat: isIncome ? 'Pemasukan' : cat,
      amount: numAmount,
      income: isIncome,
      account_id: selectedAccountId,
      metode_bayar: selectedAccount?.nama_akun ?? 'Bank',
    };

    onSave(newTx);
    handleClose();
  };

  const dateLabel = dateInfo.isToday
    ? `Hari ini (${dateInfo.dayName}), ${dateInfo.displayDate}`
    : dateInfo.fullDisplay;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
            {/* Header Modal */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.primary }]}>
                Catat Transaksi Manual
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {/* Toggle Jenis: Pengeluaran vs Pemasukan */}
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    !isIncome && { backgroundColor: colors.expenseBg, borderColor: colors.expenseBorder },
                  ]}
                  onPress={() => {
                    setIsIncome(false);
                    if (cat === 'Pemasukan') setCat('Makan');
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: colors.textSecondary },
                      !isIncome && { color: colors.expenseText, fontFamily: FONT.bold },
                    ]}
                  >
                    ↑  Pengeluaran
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isIncome && { backgroundColor: colors.incomeBg, borderColor: colors.incomeBorder },
                  ]}
                  onPress={() => {
                    setIsIncome(true);
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: colors.textSecondary },
                      isIncome && { color: colors.incomeText, fontFamily: FONT.bold },
                    ]}
                  >
                    ↓  Pemasukan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Nama Transaksi */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Transaksi *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#242426' : colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder={isIncome ? 'Misal: Gaji, Bonus, Freelance' : 'Misal: Makan Siang, Kopi, Bensin'}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError('');
                }}
              />

              {/* Input Nominal */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nominal (Rp) *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#242426' : colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={amountStr}
                onChangeText={(t) => {
                  setAmountStr(t);
                  setError('');
                }}
              />

              {/* Pilihan Kategori */}
              {!isIncome && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori Pengeluaran *</Text>
                  <View style={styles.catGrid}>
                    {EXPENSE_CATS.map((c) => {
                      const active = cat === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.catChip,
                            {
                              backgroundColor: active
                                ? isDark
                                  ? '#2D6A4F'
                                  : colors.primary
                                : isDark
                                ? '#242426'
                                : colors.surface,
                              borderColor: active
                                ? isDark
                                  ? colors.secondary
                                  : colors.primary
                                : colors.border,
                            },
                          ]}
                          onPress={() => setCat(c)}
                          activeOpacity={0.7}
                        >
                          <CategoryIconBadge categoryOrType={c} size={24} iconSize={12} borderRadius={6} />
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
                </>
              )}

              {/* Pilihan Akun Keuangan */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Akun Keuangan (Sumber/Tujuan) *</Text>
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
                      <CategoryIconBadge categoryOrType={acc.nama_akun} size={24} iconSize={12} borderRadius={6} />
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

              {/* Input Tanggal via Kalender Dinamis */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tanggal Transaksi *</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerBtn,
                  {
                    backgroundColor: isDark ? '#242426' : colors.surface,
                    borderColor: colors.border,
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
                  color={colors.isDark ? colors.secondary : colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                    {dateLabel}
                  </Text>
                </View>
                <Text style={[styles.changeDateText, { color: colors.secondary }]}>Ganti ›</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Tombol Aksi */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: isDark ? '#242426' : colors.surface,
                    },
                  ]}
                  onPress={handleClose}
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
                  <Text style={styles.submitBtnText}>Simpan Transaksi</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Calendar Picker as an In-Modal Overlay */}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 18,
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
  body: {
    paddingBottom: 16,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: FONT.regular,
    fontSize: 14,
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
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
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
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#C53030',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
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
    fontWeight: '600',
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
