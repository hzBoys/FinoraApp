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
import { useSecurityContext } from '../../../context/SecurityContext';
import { useAuthContext } from '../../../context/AuthContext';
import { FONT } from '../../../constants/typography';

export const PinLockOverlay: React.FC = () => {
  const { colors, isDark } = useThemeContext();
  const { isAppLocked, isPinEnabled, unlockApp } = useSecurityContext();
  const { logout } = useAuthContext();

  const [pinBuffer, setPinBuffer] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isAppLocked || !isPinEnabled) {
    return null;
  }

  const handleKeyPress = (num: string) => {
    if (pinBuffer.length >= 6) return;
    const nextPin = pinBuffer + num;
    setPinBuffer(nextPin);
    setErrorMessage('');

    if (nextPin.length === 6) {
      setTimeout(() => {
        const success = unlockApp(nextPin);
        if (success) {
          setPinBuffer('');
          setErrorMessage('');
        } else {
          setErrorMessage('PIN salah. Silakan coba lagi.');
          setPinBuffer('');
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    if (pinBuffer.length > 0) {
      setPinBuffer(pinBuffer.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Lupa PIN?',
      'Untuk keamanan data finansial, Anda dapat keluar dari akun dan masuk kembali menggunakan email & kata sandi.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar dari Akun',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <Modal visible={isAppLocked} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Top Header / Shield */}
        <View style={styles.headerArea}>
          <View
            style={[
              styles.shieldSquircle,
              {
                backgroundColor: isDark ? '#1C4032' : colors.mintBg,
                borderColor: isDark ? colors.secondary : colors.mintBorder,
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={32}
              color={isDark ? colors.secondary : colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Finora Terkunci</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Masukkan 6-digit PIN untuk membuka aplikasi
          </Text>
        </View>

        {/* 6 Dots Indicator */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = pinBuffer.length > idx;
            const hasError = !!errorMessage;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    borderColor: hasError ? '#E63946' : colors.border,
                    backgroundColor: filled
                      ? hasError
                        ? '#E63946'
                        : isDark
                        ? colors.secondary
                        : colors.primary
                      : 'transparent',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Error message */}
        <View style={styles.errorBox}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        {/* Numeric Keypad (Apple Style) */}
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
                      style={styles.numKeyAction}
                      onPress={handleDelete}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="backspace-outline" size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={cIdx}
                    style={[
                      styles.numKey,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                        borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
                      },
                    ]}
                    onPress={() => handleKeyPress(item)}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.numKeyText, { color: colors.textPrimary }]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer: Forgot PIN */}
        <TouchableOpacity style={styles.footerBtn} onPress={handleForgotPin} activeOpacity={0.7}>
          <Text style={[styles.footerBtnText, { color: colors.textMuted }]}>
            Lupa PIN? Keluar dari Akun
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldSquircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONT.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 10,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
  },
  errorBox: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: '#E63946',
    textAlign: 'center',
  },
  numpad: {
    width: '100%',
    maxWidth: 290,
    gap: 14,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyAction: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyEmpty: {
    width: 72,
    height: 72,
  },
  numKeyText: {
    fontFamily: FONT.bold,
    fontSize: 26,
    fontWeight: '700',
  },
  footerBtn: {
    marginTop: 32,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  footerBtnText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
