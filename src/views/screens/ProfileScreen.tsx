import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { LAYOUT } from '../../constants/theme';
import { FONT } from '../../constants/typography';
import { ThemeMode, UserProfile } from '../../models/types';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIconBadge } from '../components/icons/CategoryIconBadge';

type ProfileScreenProps = {
  user: UserProfile;
  themeMode: ThemeMode;
  onPickImage: () => void;
  onOpenEditProfile: () => void;
  onOpenThemeModal: () => void;
  onOpenNotificationSettings?: () => void;
  notificationSubtitle?: string;
  totalBalance?: number;
  bottomSafeInset?: number;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  themeMode,
  onPickImage,
  onOpenEditProfile,
  onOpenThemeModal,
  onOpenNotificationSettings,
  notificationSubtitle = 'Pengingat catat struk & limit anggaran',
  totalBalance = 0,
  bottomSafeInset = LAYOUT.bottomSafeHeight,
}) => {
  const { colors } = useThemeContext();
  const { logout } = useAuthContext();

  const themeLabel =
    themeMode === 'light' ? 'Mode Terang' : themeMode === 'dark' ? 'Mode Gelap' : 'Ikuti Sistem';

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun Finora?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        {
          paddingBottom: LAYOUT.tabHeight + bottomSafeInset + 16,
          backgroundColor: colors.surface,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar & User Info */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarTouchable} activeOpacity={0.8} onPress={onPickImage}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary, borderColor: colors.secondary }]}>
            {user.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user.nama.charAt(0)}</Text>
            )}
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="camera" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{user.nama}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>@{user.username} · {user.email}</Text>
        <Text style={[styles.roleTag, { color: colors.primary, backgroundColor: colors.mintBg }]}>
          {user.role}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.isDark ? '#2D6A4F' : colors.primary }]}
            activeOpacity={0.8}
            onPress={onOpenEditProfile}
          >
            <Text style={styles.editBtnText}>Ubah Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            activeOpacity={0.8}
            onPress={onPickImage}
          >
            <Text style={[styles.photoBtnText, { color: colors.textSecondary }]}>Ganti Foto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kartu Akun Portofolio */}
      <View
        style={[
          styles.accountCard,
          {
            backgroundColor: colors.widgetBg,
            borderColor: colors.widgetBorder,
            borderWidth: colors.isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.deco1} />
        <View style={styles.deco2} />
        <View style={styles.accountInner}>
          <View style={styles.accountRow}>
            <View>
              <Text style={[styles.accountLabel, { color: colors.textOnDarkDim }]}>Status Akun</Text>
              <Text style={[styles.accountValue, { color: colors.textOnDark }]}>Personal</Text>
            </View>
            <View
              style={[
                styles.accountBadge,
                { backgroundColor: colors.isDark ? 'rgba(82, 183, 136, 0.25)' : 'rgba(196, 235, 217, 0.2)' },
              ]}
            >
              <Text style={[styles.accountBadgeText, { color: colors.textOnDark }]}>Aktif</Text>
            </View>
          </View>
          <View
            style={[
              styles.accountDivider,
              { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(196, 235, 217, 0.15)' },
            ]}
          />
          <Text style={[styles.accountPortoLabel, { color: colors.textOnDarkDim }]}>Saldo Portofolio</Text>
          <Text style={[styles.accountPortoValue, { color: colors.textOnDark }]}>
            Rp{totalBalance.toLocaleString('id-ID')}
          </Text>
          <Text style={[styles.accountNote, { color: colors.textOnDarkDim }]}>
            Tersinkronisasi otomatis dengan pos Bank, E-Wallet, dan Investasi.
          </Text>
        </View>
      </View>

      {/* Menu Grup: Preferensi */}
      <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Preferensi</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuBorder, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={onOpenEditProfile}
        >
          <CategoryIconBadge categoryOrType="Akun" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Pengaturan Akun</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{user.nama} ({user.email})</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuBorder, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={onOpenThemeModal}
        >
          <CategoryIconBadge categoryOrType="Tema" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Tampilan Aplikasi</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{themeLabel} (Ketuk untuk ubah)</Text>
          </View>
          <View
            style={[
              styles.themeTag,
              { backgroundColor: colors.isDark ? 'rgba(82, 183, 136, 0.18)' : colors.mintBg },
            ]}
          >
            <Text style={[styles.themeTagText, { color: colors.secondary }]}>{themeLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={onOpenNotificationSettings}
        >
          <CategoryIconBadge categoryOrType="Notifikasi" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Notifikasi</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{notificationSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Menu Grup: Keamanan */}
      <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Keamanan</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuBorder, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Privasi & Keamanan', 'Data transaksi Anda dienkripsi dan disimpan secara privat.')}
        >
          <CategoryIconBadge categoryOrType="Privasi" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Privasi dan Keamanan</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Privasi data finansial terjamin</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => Alert.alert('PIN & Autentikasi', 'Fitur PIN dan Biometrik Finora aktif.')}
        >
          <CategoryIconBadge categoryOrType="PIN" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>PIN dan Autentikasi</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Kunci aplikasi saat tidak digunakan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Menu Grup: Bantuan */}
      <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Bantuan</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuBorder, { borderBottomColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Pusat Bantuan', 'Silakan hubungi tim Finora di support@finora.app')}
        >
          <CategoryIconBadge categoryOrType="Bantuan" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Pusat Bantuan</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>FAQ dan panduan penggunaan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Tentang Finora', 'Finora v1.0.0 — Asisten Finansial Pintar')}
        >
          <CategoryIconBadge categoryOrType="Tentang" size={30} iconSize={16} />
          <View style={{ flex: 1, paddingLeft: 4 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Tentang Finora</Text>
            <Text style={[styles.menuDesc, { color: colors.textMuted }]}>Versi 1.0.0</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            backgroundColor: colors.expenseBg,
            borderColor: colors.expenseBorder,
          },
        ]}
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.expenseText} style={{ marginRight: 6 }} />
        <Text style={[styles.logoutText, { color: colors.expenseText }]}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingTop: 12,
    gap: 12,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontFamily: FONT.bold,
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontFamily: FONT.bold,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontFamily: FONT.regular,
    fontSize: 13,
    marginBottom: 6,
  },
  roleTag: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 14,
  },
  editBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontWeight: '500',
  },
  accountCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(82, 183, 136, 0.15)',
  },
  deco2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(196, 235, 217, 0.08)',
  },
  accountInner: {
    padding: 20,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(196, 235, 217, 0.7)',
    marginBottom: 2,
  },
  accountValue: {
    fontFamily: FONT.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountBadge: {
    backgroundColor: 'rgba(196, 235, 217, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  accountBadgeText: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(196, 235, 217, 0.9)',
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(196, 235, 217, 0.15)',
    marginVertical: 12,
  },
  accountPortoLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    color: 'rgba(196, 235, 217, 0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  accountPortoValue: {
    fontFamily: FONT.bold,
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  accountNote: {
    fontFamily: FONT.regular,
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(196, 235, 217, 0.5)',
    fontStyle: 'italic',
  },
  groupTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  menuDesc: {
    fontFamily: FONT.regular,
    fontSize: 11,
  },
  themeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  themeTagText: {
    fontFamily: FONT.semiBold,
    fontSize: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    fontWeight: '700',
  },
});
