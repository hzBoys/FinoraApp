import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../context/ThemeContext';
import { AUTOLOCK_OPTIONS, useSecurityContext } from '../../../context/SecurityContext';
import { FONT } from '../../../constants/typography';
import { LAYOUT } from '../../../constants/theme';

type PinSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  bottomSafeInset?: number;
};

type SubFlow = 'main' | 'setup_new' | 'setup_confirm' | 'change_verify' | 'change_new' | 'change_confirm' | 'disable_verify';

export const PinSettingsModal: React.FC<PinSettingsModalProps> = ({
  visible,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const {
    isPinEnabled,
    autolockDelay,
    setPin,
    changePin,
    removePin,
    setAutolockDelay,
    verifyPin,
  } = useSecurityContext();

  const [flow, setFlow] = useState<SubFlow>('main');
  const [pinBuffer, setPinBuffer] = useState<string>('');
  const [tempNewPin, setTempNewPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resetFlow = () => {
    setFlow('main');
    setPinBuffer('');
    setTempNewPin('');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleKeyPress = (num: string) => {
    if (pinBuffer.length >= 6) return;
    const nextPin = pinBuffer + num;
    setPinBuffer(nextPin);
    setErrorMessage('');

    if (nextPin.length === 6) {
      setTimeout(() => {
        handlePinComplete(nextPin);
      }, 100);
    }
  };

  const handleDelete = () => {
    if (pinBuffer.length > 0) {
      setPinBuffer(pinBuffer.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handlePinComplete = async (completedPin: string) => {
    switch (flow) {
      case 'setup_new':
        setTempNewPin(completedPin);
        setPinBuffer('');
        setFlow('setup_confirm');
        break;

      case 'setup_confirm':
        if (completedPin === tempNewPin) {
          const success = await setPin(completedPin);
          if (success) {
            Alert.alert('PIN Berhasil Dibuat', 'Kunci PIN keamanan Finora kini telah aktif.');
            resetFlow();
          } else {
            setErrorMessage('Gagal menyimpan PIN. Coba lagi.');
            setPinBuffer('');
          }
        } else {
          setErrorMessage('Konfirmasi PIN tidak cocok. Silakan ulangi.');
          setPinBuffer('');
          setFlow('setup_new');
        }
        break;

      case 'change_verify':
        if (verifyPin(completedPin)) {
          setPinBuffer('');
          setFlow('change_new');
        } else {
          setErrorMessage('PIN lama salah. Coba lagi.');
          setPinBuffer('');
        }
        break;

      case 'change_new':
        setTempNewPin(completedPin);
        setPinBuffer('');
        setFlow('change_confirm');
        break;

      case 'change_confirm':
        if (completedPin === tempNewPin) {
          const success = await changePin(tempNewPin, completedPin);
          if (success) {
            Alert.alert('PIN Diperbarui', 'PIN keamanan berhasil diubah.');
            resetFlow();
          } else {
            setErrorMessage('Gagal memperbarui PIN. Coba lagi.');
            setPinBuffer('');
          }
        } else {
          setErrorMessage('Konfirmasi PIN tidak cocok. Silakan ulangi.');
          setPinBuffer('');
          setFlow('change_new');
        }
        break;

      case 'disable_verify':
        if (verifyPin(completedPin)) {
          await removePin(completedPin);
          Alert.alert('PIN Dinonaktifkan', 'Kunci aplikasi Finora telah dinonaktifkan.');
          resetFlow();
        } else {
          setErrorMessage('PIN salah. Coba lagi.');
          setPinBuffer('');
        }
        break;

      default:
        break;
    }
  };

  const getFlowTitle = () => {
    switch (flow) {
      case 'setup_new':
        return 'Buat PIN 6-Digit';
      case 'setup_confirm':
        return 'Konfirmasi PIN Baru';
      case 'change_verify':
        return 'Masukkan PIN Lama';
      case 'change_new':
        return 'Buat PIN Baru';
      case 'change_confirm':
        return 'Konfirmasi PIN Baru';
      case 'disable_verify':
        return 'Verifikasi PIN untuk Menonaktifkan';
      default:
        return 'PIN Keamanan';
    }
  };

  const getFlowSubtitle = () => {
    switch (flow) {
      case 'setup_new':
        return 'Tentukan 6 angka yang mudah Anda ingat';
      case 'setup_confirm':
        return 'Masukkan ulang 6 angka PIN Anda';
      case 'change_verify':
        return 'Masukkan PIN yang aktif saat ini';
      case 'change_new':
        return 'Masukkan 6 angka PIN baru';
      case 'change_confirm':
        return 'Masukkan kembali PIN baru Anda';
      case 'disable_verify':
        return 'Masukkan PIN Anda untuk mematikan kunci';
      default:
        return 'Kunci aplikasi secara otomatis saat tidak aktif';
    }
  };

  const activeDelayOption = AUTOLOCK_OPTIONS.find((o) => o.seconds === autolockDelay) || AUTOLOCK_OPTIONS[1];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
            {flow !== 'main' ? (
              <TouchableOpacity onPress={resetFlow} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 20 }} />
            )}
            <Text style={[styles.title, { color: colors.primary }]}>{getFlowTitle()}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {flow === 'main' ? (
            /* Main Dashboard View */
            <View style={styles.mainContent}>
              <View style={styles.statusCard}>
                <View style={styles.statusLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isPinEnabled
                          ? colors.isDark ? '#1C4032' : colors.mintBg
                          : colors.isDark ? '#2C2C2E' : '#F2F2F7',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isPinEnabled ? 'shield-checkmark' : 'shield-outline'}
                      size={24}
                      color={isPinEnabled ? colors.secondary : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                      {isPinEnabled ? 'PIN Aktif' : 'PIN Belum Diatur'}
                    </Text>
                    <Text style={[styles.statusDesc, { color: colors.textMuted }]}>
                      {isPinEnabled
                        ? `Kunci otomatis: ${activeDelayOption.label}`
                        : 'Lindungi privasi transaksi Finora dengan PIN'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isPinEnabled
                        ? colors.isDark ? 'rgba(82, 183, 136, 0.2)' : colors.mintBg
                        : 'rgba(150, 150, 150, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isPinEnabled ? colors.secondary : colors.textMuted },
                    ]}
                  >
                    {isPinEnabled ? 'Aktif' : 'Nonaktif'}
                  </Text>
                </View>
              </View>

              {!isPinEnabled ? (
                /* Unconfigured state */
                <View style={{ marginTop: 24, gap: 14 }}>
                  <Text style={[styles.explainText, { color: colors.textSecondary }]}>
                    Jika diaktifkan, Finora akan meminta PIN 6-digit saat dibuka atau setelah Anda meninggalkan aplikasi.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setPinBuffer('');
                      setFlow('setup_new');
                    }}
                  >
                    <Ionicons name="lock-closed" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionBtnText}>Pasang PIN Keamanan</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Configured state */
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    Waktu Kunci Otomatis (Auto-Lock)
                  </Text>
                  <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {AUTOLOCK_OPTIONS.map((option, index) => {
                      const isSelected = autolockDelay === option.seconds;
                      return (
                        <TouchableOpacity
                          key={option.seconds}
                          style={[
                            styles.optionRow,
                            index < AUTOLOCK_OPTIONS.length - 1 && [styles.optionBorder, { borderBottomColor: colors.border }],
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setAutolockDelay(option.seconds)}
                        >
                          <Text
                            style={[
                              styles.optionLabel,
                              { color: isSelected ? colors.primary : colors.textPrimary },
                              isSelected && { fontFamily: FONT.semiBold, fontWeight: '600' },
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={19} color={colors.secondary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Actions */}
                  <View style={{ marginTop: 22, gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.outlineActionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setPinBuffer('');
                        setFlow('change_verify');
                      }}
                    >
                      <Ionicons name="key-outline" size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                      <Text style={[styles.outlineActionBtnText, { color: colors.textPrimary }]}>
                        Ubah PIN
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.outlineActionBtn,
                        { borderColor: colors.expenseBorder, backgroundColor: colors.expenseBg },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setPinBuffer('');
                        setFlow('disable_verify');
                      }}
                    >
                      <Ionicons name="lock-open-outline" size={16} color={colors.expenseText} style={{ marginRight: 6 }} />
                      <Text style={[styles.outlineActionBtnText, { color: colors.expenseText }]}>
                        Nonaktifkan Kunci PIN
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* PIN Keypad Entry View */
            <View style={styles.keypadView}>
              <Text style={[styles.keypadSubtitle, { color: colors.textSecondary }]}>
                {getFlowSubtitle()}
              </Text>

              {/* PIN Dots (6 digits) */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const filled = pinBuffer.length > idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        {
                          borderColor: colors.border,
                          backgroundColor: filled
                            ? colors.isDark ? colors.secondary : colors.primary
                            : 'transparent',
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Error message */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : (
                <View style={{ height: 20 }} />
              )}

              {/* Numeric Keypad */}
              <View style={styles.numpad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['', '0', 'del'],
                ].map((row, rIdx) => (
                  <View key={rIdx} style={styles.numRow}>
                    {row.map((item, cIdx) => {
                      if (!item) {
                        return <View key={cIdx} style={styles.numKeyEmpty} />;
                      }
                      if (item === 'del') {
                        return (
                          <TouchableOpacity
                            key={cIdx}
                            style={styles.numKey}
                            onPress={handleDelete}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity
                          key={cIdx}
                          style={[
                            styles.numKey,
                            { backgroundColor: colors.isDark ? '#2C2C2E' : '#F2F2F7' },
                          ]}
                          onPress={() => handleKeyPress(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.numKeyText, { color: colors.textPrimary }]}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}
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
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '500',
    padding: 4,
  },
  mainContent: {
    paddingVertical: 6,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusDesc: {
    fontFamily: FONT.regular,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
  },
  explainText: {
    fontFamily: FONT.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  optionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  optionBorder: {
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlineActionBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  keypadView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  keypadSubtitle: {
    fontFamily: FONT.regular,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  errorText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: '#E63946',
    textAlign: 'center',
    height: 20,
  },
  numpad: {
    width: '100%',
    maxWidth: 280,
    marginTop: 10,
    gap: 12,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numKey: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyEmpty: {
    width: 66,
    height: 66,
  },
  numKeyText: {
    fontFamily: FONT.bold,
    fontSize: 22,
    fontWeight: '700',
  },
});
