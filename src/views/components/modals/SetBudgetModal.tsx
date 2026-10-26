import React, { useEffect, useState } from 'react';
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
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { CategoryLimits } from '../../../controllers/useBudget';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type SetBudgetModalProps = {
  visible: boolean;
  currentTotal: number;
  onSave: (total: number, customLimits?: CategoryLimits) => void;
  onClose: () => void;
  bottomSafeInset?: number;
};

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  visible,
  currentTotal,
  onSave,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors, isDark } = useThemeContext();
  const [mode, setMode] = useState<'advisor' | 'manual'>('advisor');

  const [totalStr, setTotalStr] = useState(currentTotal > 0 ? String(currentTotal) : '3000000');
  const [makanStr, setMakanStr] = useState('900000');
  const [transStr, setTransStr] = useState('450000');
  const [tagihanStr, setTagihanStr] = useState('450000');
  const [belanjaStr, setBelanjaStr] = useState('600000');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      const initTotal = currentTotal > 0 ? currentTotal : 3000000;
      setTotalStr(String(initTotal));
      setMakanStr(String(Math.round(initTotal * 0.3)));
      setTransStr(String(Math.round(initTotal * 0.15)));
      setTagihanStr(String(Math.round(initTotal * 0.15)));
      setBelanjaStr(String(Math.round(initTotal * 0.2)));
      setError('');
    }
  }, [visible, currentTotal]);

  const numTotal = Number(totalStr.replace(/[^0-9]/g, '')) || 0;

  // Smart advisor live auto-breakdown
  const advisorMakan = Math.round(numTotal * 0.3);
  const advisorTrans = Math.round(numTotal * 0.15);
  const advisorTagihan = Math.round(numTotal * 0.15);
  const advisorBelanja = Math.round(numTotal * 0.2);
  const advisorTabungan = Math.max(0, numTotal - (advisorMakan + advisorTrans + advisorTagihan + advisorBelanja));

  const handleSaveAdvisor = () => {
    if (numTotal <= 0) {
      setError('Masukkan total anggaran lebih besar dari 0.');
      return;
    }
    onSave(numTotal);
    onClose();
  };

  const handleSaveManual = () => {
    if (numTotal <= 0) {
      setError('Masukkan total anggaran lebih besar dari 0.');
      return;
    }

    const numMakan = Number(makanStr.replace(/[^0-9]/g, '')) || 0;
    const numTrans = Number(transStr.replace(/[^0-9]/g, '')) || 0;
    const numTagihan = Number(tagihanStr.replace(/[^0-9]/g, '')) || 0;
    const numBelanja = Number(belanjaStr.replace(/[^0-9]/g, '')) || 0;

    const sumCategories = numMakan + numTrans + numTagihan + numBelanja;
    if (sumCategories > numTotal) {
      setError(`Total per pos (Rp${sumCategories.toLocaleString('id-ID')}) melebihi total anggaran (Rp${numTotal.toLocaleString('id-ID')}).`);
      return;
    }

    onSave(numTotal, {
      Makan: numMakan,
      Transportasi: numTrans,
      Tagihan: numTagihan,
      Belanja: numBelanja,
    });
    onClose();
  };

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
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : colors.primary }]}>
              Atur Batas Anggaran
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <View style={[styles.modeToggleRow, { backgroundColor: isDark ? '#242426' : colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                mode === 'advisor' && [
                  styles.modeBtnActive,
                  { backgroundColor: isDark ? '#2D6A4F' : colors.primary },
                ],
              ]}
              onPress={() => {
                setMode('advisor');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'advisor' ? '#FFFFFF' : colors.textSecondary },
                  mode === 'advisor' && { fontFamily: FONT.bold },
                ]}
              >
                Smart Advisor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                mode === 'manual' && [
                  styles.modeBtnActive,
                  { backgroundColor: isDark ? '#2D6A4F' : colors.primary },
                ],
              ]}
              onPress={() => {
                setMode('manual');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'manual' ? '#FFFFFF' : colors.textSecondary },
                  mode === 'manual' && { fontFamily: FONT.bold },
                ]}
              >
                Manual
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Input Total Anggaran */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Total Anggaran Bulanan (Rp) *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={totalStr}
              onChangeText={(t) => {
                setTotalStr(t);
                setError('');
              }}
              keyboardType="number-pad"
              placeholder="3000000"
              placeholderTextColor={colors.textMuted}
            />

            {/* MODE 1: SMART ADVISOR BREAKDOWN */}
            {mode === 'advisor' && (
              <View style={[styles.previewCard, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.previewHeader, { color: colors.textSecondary }]}>Alokasi Rekomendasi:</Text>

                <View style={styles.previewRow}>
                  <View style={styles.catLeft}>
                    <CategoryIconBadge categoryOrType="Makan" size={24} iconSize={12} borderRadius={6} />
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>Makan (30%)</Text>
                  </View>
                  <Text style={[styles.catValue, { color: colors.textPrimary }]}>Rp{advisorMakan.toLocaleString('id-ID')}</Text>
                </View>

                <View style={styles.previewRow}>
                  <View style={styles.catLeft}>
                    <CategoryIconBadge categoryOrType="Transportasi" size={24} iconSize={12} borderRadius={6} />
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>Transportasi (15%)</Text>
                  </View>
                  <Text style={[styles.catValue, { color: colors.textPrimary }]}>Rp{advisorTrans.toLocaleString('id-ID')}</Text>
                </View>

                <View style={styles.previewRow}>
                  <View style={styles.catLeft}>
                    <CategoryIconBadge categoryOrType="Tagihan" size={24} iconSize={12} borderRadius={6} />
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>Tagihan (15%)</Text>
                  </View>
                  <Text style={[styles.catValue, { color: colors.textPrimary }]}>Rp{advisorTagihan.toLocaleString('id-ID')}</Text>
                </View>

                <View style={styles.previewRow}>
                  <View style={styles.catLeft}>
                    <CategoryIconBadge categoryOrType="Belanja" size={24} iconSize={12} borderRadius={6} />
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>Belanja (20%)</Text>
                  </View>
                  <Text style={[styles.catValue, { color: colors.textPrimary }]}>Rp{advisorBelanja.toLocaleString('id-ID')}</Text>
                </View>

                <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.catLeft}>
                    <CategoryIconBadge categoryOrType="Pemasukan" size={24} iconSize={12} borderRadius={6} />
                    <Text style={[styles.catName, { color: colors.incomeText, fontFamily: FONT.bold }]}>Tabungan (20%)</Text>
                  </View>
                  <Text style={[styles.catValue, { color: colors.incomeText, fontFamily: FONT.bold }]}>
                    Rp{advisorTabungan.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            )}

            {/* MODE 2: MANUAL CATEGORY INPUTS */}
            {mode === 'manual' && (
              <View style={{ gap: 10, marginTop: 4 }}>
                <Text style={[styles.previewHeader, { color: colors.textSecondary }]}>Batas Per Kategori (Rp):</Text>

                <View style={styles.manualFieldRow}>
                  <CategoryIconBadge categoryOrType="Makan" size={28} iconSize={14} borderRadius={7} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>Makan & Minum</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                      value={makanStr}
                      onChangeText={(t) => { setMakanStr(t); setError(''); }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.manualFieldRow}>
                  <CategoryIconBadge categoryOrType="Transportasi" size={28} iconSize={14} borderRadius={7} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>Transportasi</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                      value={transStr}
                      onChangeText={(t) => { setTransStr(t); setError(''); }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.manualFieldRow}>
                  <CategoryIconBadge categoryOrType="Tagihan" size={28} iconSize={14} borderRadius={7} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>Tagihan</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                      value={tagihanStr}
                      onChangeText={(t) => { setTagihanStr(t); setError(''); }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.manualFieldRow}>
                  <CategoryIconBadge categoryOrType="Belanja" size={28} iconSize={14} borderRadius={7} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>Belanja</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: isDark ? '#242426' : colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                      value={belanjaStr}
                      onChangeText={(t) => { setBelanjaStr(t); setError(''); }}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                onPress={mode === 'advisor' ? handleSaveAdvisor : handleSaveManual}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {mode === 'advisor' ? 'Terapkan Anggaran' : 'Simpan Anggaran'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    alignItems: 'center',
    marginBottom: 14,
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
  modeToggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontFamily: FONT.medium,
    fontSize: 13,
  },
  body: {
    paddingBottom: 16,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: FONT.regular,
    fontSize: 15,
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  previewHeader: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    fontFamily: FONT.medium,
    fontSize: 13,
  },
  catValue: {
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  manualFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manualLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    marginBottom: 3,
  },
  smallInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: FONT.regular,
    fontSize: 13,
  },
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#FF453A',
    fontSize: 12,
    marginTop: 8,
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
