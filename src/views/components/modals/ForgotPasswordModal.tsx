import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuthContext } from '../../../context/AuthContext';
import { FONT } from '../../../constants/typography';
import { LAYOUT } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type ForgotPasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  bottomSafeInset?: number;
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const { resetPassword, verifyResetOtp } = useAuthContext();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStep('request');
      setEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setIsLoading(false);
      setCountdown(0);
    }
  }, [visible]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    setError('');
    setIsLoading(true);

    const res = await resetPassword(cleanEmail);
    setIsLoading(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    setCountdown(60);
    setStep('verify');
    Alert.alert(
      'Kode OTP Terkirim',
      `Kode verifikasi 6 digit telah dikirimkan ke ${cleanEmail}. Periksa kotak masuk atau spam email Anda.`
    );
  };

  // Step 2: Verify OTP & Set New Password
  const handleVerifyAndReset = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Masukkan 6 digit kode OTP yang diterima.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setError('');
    setIsLoading(true);

    const res = await verifyResetOtp(email, cleanOtp, newPassword);
    setIsLoading(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    Alert.alert('Kata Sandi Berhasil Diperbarui', res.message, [
      {
        text: 'Masuk Sekarang',
        onPress: () => {
          onClose();
        },
      },
    ]);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
    setCountdown(60);
    Alert.alert('Kode Terkirim Ulang', `Kode OTP baru telah dikirim ke ${email}.`);
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {step === 'request' ? 'Lupa Kata Sandi' : 'Verifikasi OTP & Sandi Baru'}
              </Text>
              <Text style={[styles.stepBadge, { color: colors.secondary }]}>
                {step === 'request' ? 'Langkah 1 dari 2' : 'Langkah 2 dari 2'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* STEP 1: REQUEST OTP */}
            {step === 'request' && (
              <>
                <Text style={[styles.desc, { color: colors.textSecondary }]}>
                  Masukkan alamat email yang terdaftar. Kami akan mengirimkan 6 digit kode OTP verifikasi untuk mengatur ulang kata sandi.
                </Text>

                <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat Email Akun *</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="user@finora.app"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      },
                    ]}
                    onPress={onClose}
                  >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
                    ]}
                    onPress={handleRequestOtp}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Kirim Kode OTP ›</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 2: VERIFY OTP & NEW PASSWORD */}
            {step === 'verify' && (
              <>
                <View
                  style={[
                    styles.infoBanner,
                    {
                      backgroundColor: colors.isDark ? '#14241B' : '#F0FAF4',
                      borderColor: colors.isDark ? '#1F422C' : colors.mintBorder,
                    },
                  ]}
                >
                  <Ionicons name="mail-unread-outline" size={20} color={colors.incomeText} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, { color: colors.isDark ? colors.secondary : colors.primary }]}>
                      Kode OTP Terkirim
                    </Text>
                    <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                      Masukkan 6 digit kode yang dikirim ke <Text style={{ fontFamily: FONT.bold }}>{email}</Text>
                    </Text>
                  </View>
                </View>

                {/* 6 Digit OTP Input */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Kode OTP (6 Digit) *</Text>
                <View style={[styles.otpInputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="key-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.otpInput, { color: colors.isDark ? colors.secondary : colors.primary }]}
                    placeholder="123456"
                    placeholderTextColor={colors.textMuted}
                    value={otpCode}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtpCode(cleaned);
                      setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                {/* Resend Link */}
                <View style={styles.resendRow}>
                  <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || isLoading}>
                    <Text
                      style={[
                        styles.resendText,
                        { color: countdown > 0 ? colors.textMuted : colors.secondary },
                      ]}
                    >
                      {countdown > 0
                        ? `Kirim ulang kode dalam ${countdown} detik`
                        : 'Belum terima kode? Kirim Ulang'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Kata Sandi Baru */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Kata Sandi Baru *</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor={colors.textMuted}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Konfirmasi Kata Sandi Baru */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>Konfirmasi Kata Sandi Baru *</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Ulangi kata sandi baru"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.isDark ? '#242426' : colors.surface,
                      },
                    ]}
                    onPress={() => setStep('request')}
                  >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>‹ Ubah Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary },
                    ]}
                    onPress={handleVerifyAndReset}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Perbarui Sandi</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  stepBadge: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    marginTop: 2,
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  body: {
    paddingBottom: 16,
  },
  desc: {
    fontFamily: FONT.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  infoTitle: {
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  infoDesc: {
    fontFamily: FONT.regular,
    fontSize: 11,
    marginTop: 1,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  otpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  otpInput: {
    flex: 1,
    fontFamily: FONT.bold,
    fontSize: 20,
    letterSpacing: 8,
  },
  resendRow: {
    marginTop: 6,
    alignItems: 'flex-end',
  },
  resendText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#C53030',
    fontSize: 12,
    marginTop: 10,
  },
  actionRow: {
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
  cancelText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
  },
  primaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
