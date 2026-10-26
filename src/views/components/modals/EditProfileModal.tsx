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
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';
import { UserProfile } from '../../../models/types';
import { Ionicons } from '@expo/vector-icons';

type EditProfileModalProps = {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  onPickAvatar: () => void;
  bottomSafeInset?: number;
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
  onPickAvatar,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const [nama, setNama] = useState(user.nama);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState('');

  useEffect(() => {
    setNama(user.nama);
    setUsername(user.username);
    setEmail(user.email);
    setError('');
  }, [user, visible]);

  const handleSave = () => {
    if (!nama.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!username.trim()) {
      setError('Username tidak boleh kosong.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      return;
    }

    onSave({
      nama: nama.trim(),
      username: username.trim(),
      email: email.trim(),
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>Pengaturan Akun & Profil</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Avatar Row */}
            <View style={[styles.avatarRow, { backgroundColor: colors.isDark ? '#242426' : colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={onPickAvatar}
                activeOpacity={0.8}
                style={[styles.avatarContainer, { backgroundColor: colors.isDark ? '#1C4032' : colors.primary }]}
              >
                {user.avatarUri ? (
                  <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarInitials, { color: colors.isDark ? colors.secondary : '#FFFFFF' }]}>
                    {user.nama.charAt(0)}
                  </Text>
                )}
                <View style={[styles.cameraBadge, { backgroundColor: colors.isDark ? '#1C1C1E' : colors.card, borderColor: colors.border }]}>
                  <Ionicons name="camera" size={11} color={colors.secondary} />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.avatarLabel, { color: colors.textPrimary }]}>Foto Profil Pengguna</Text>
                <TouchableOpacity onPress={onPickAvatar}>
                  <Text style={[styles.changePhotoText, { color: colors.secondary }]}>Ganti atau Pilih Foto Demo ›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fields */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Lengkap *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={nama}
              onChangeText={(t) => { setNama(t); setError(''); }}
              placeholder="Nama Lengkap"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Username / Handle *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(''); }}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat Email *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.isDark ? '#242426' : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="email@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Actions */}
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
                activeOpacity={0.7}
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
                <Text style={styles.submitBtnText}>Simpan Perubahan</Text>
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
    maxHeight: '90%',
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
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  body: {
    paddingBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: FONT.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarLabel: {
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  changePhotoText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    marginTop: 3,
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
