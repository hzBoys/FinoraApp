import React, { useState } from 'react';
import {
  Alert,
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

type RegisterScreenProps = {
  onGoToLogin: () => void;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onGoToLogin }) => {
  const { colors } = useThemeContext();
  const { register } = useAuthContext();

  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!nama.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!username.trim()) {
      setError('Username wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    const res = await register(nama, username, email, password);
    if (!res.success) {
      setError(res.message || 'Pendaftaran gagal.');
    } else {
      Alert.alert(
        'Pendaftaran Berhasil',
        `Selamat datang di Finora, ${nama.trim()}! Akun Anda aktif dan siap digunakan.`
      );
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
        {/* Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoIconCircle, { backgroundColor: colors.isDark ? '#1C4032' : colors.primary }]}>
            <Ionicons name="person-add-outline" size={28} color={colors.isDark ? colors.secondary : '#FFFFFF'} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>Buat Akun Finora</Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            Mulai kelola keuangan Anda secara rapi dan otomatis.
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Lengkap *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Nama Lengkap Anda"
              placeholderTextColor={colors.textMuted}
              value={nama}
              onChangeText={(t) => { setNama(t); setError(''); }}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Username / Handle *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="at-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="userfinora"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat Email *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="user@finora.app"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Kata Sandi *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Minimal 6 karakter"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Konfirmasi Kata Sandi *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Ulangi kata sandi"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary }]}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Sudah memiliki akun? </Text>
          <TouchableOpacity onPress={onGoToLogin} activeOpacity={0.7}>
            <Text style={[styles.loginLink, { color: colors.isDark ? colors.secondary : colors.primary }]}>
              Masuk ke Akun
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
    marginBottom: 20,
  },
  logoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontFamily: FONT.bold,
    fontSize: 24,
    fontWeight: '700',
  },
  brandTagline: {
    fontFamily: FONT.medium,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
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
  errorText: {
    fontFamily: FONT.semiBold,
    color: '#C53030',
    fontSize: 12,
    marginTop: 10,
  },
  registerBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerBtnText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: FONT.regular,
    fontSize: 13,
  },
  loginLink: {
    fontFamily: FONT.bold,
    fontSize: 13,
    fontWeight: '700',
  },
});
