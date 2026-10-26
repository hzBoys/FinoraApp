import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { FONT } from '../../constants/typography';
import { LAYOUT } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenProps = {
  onGoToRegister: () => void;
  onOpenForgotPassword: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoToRegister,
  onOpenForgotPassword,
}) => {
  const { colors } = useThemeContext();
  const { login } = useAuthContext();

  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrUser.trim()) {
      setError('Masukkan email atau username.');
      return;
    }
    if (!password) {
      setError('Masukkan kata sandi akun.');
      return;
    }

    const res = await login(emailOrUser, password);
    if (!res.success) {
      setError(res.message || 'Login gagal.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoIconCircle, { backgroundColor: colors.isDark ? '#1C4032' : colors.primary }]}>
            <Ionicons name="wallet-outline" size={32} color={colors.isDark ? colors.secondary : '#FFFFFF'} />
          </View>
          <View style={styles.brandRow}>
            <Text style={[styles.brandTitle, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>Finora</Text>
            <View style={[styles.brandDot, { backgroundColor: colors.secondary }]} />
          </View>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            Asisten Finansial Pintar & Konsolidasi Saldo
          </Text>
        </View>

        {/* Card Container */}
        <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Masuk ke Finora</Text>

          {/* Email / Username Field */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email atau Username</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="user@finora.app atau userfinora"
              placeholderTextColor={colors.textMuted}
              value={emailOrUser}
              onChangeText={(t) => {
                setEmailOrUser(t);
                setError('');
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Password Field */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Kata Sandi</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotBtn} onPress={onOpenForgotPassword} activeOpacity={0.7}>
            <Text style={[styles.forgotText, { color: colors.secondary }]}>Lupa Kata Sandi?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary }]}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Belum memiliki akun Finora? </Text>
          <TouchableOpacity onPress={onGoToRegister} activeOpacity={0.7}>
            <Text style={[styles.registerLink, { color: colors.isDark ? colors.secondary : colors.primary }]}>
              Daftar Baru
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenGutter,
    paddingVertical: 32,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: FONT.bold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 4,
    marginBottom: 4,
  },
  brandTagline: {
    fontFamily: FONT.medium,
    fontSize: 13,
    marginTop: 4,
  },
  loginCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: FONT.bold,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
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
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#C53030',
    fontSize: 12,
    marginTop: 12,
  },
  loginBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginBtnText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: FONT.regular,
    fontSize: 13,
  },
  registerLink: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
});
