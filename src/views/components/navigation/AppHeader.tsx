import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { LAYOUT } from '../../../constants/theme';
import { FONT } from '../../../constants/typography';

type AppHeaderProps = {
  userName?: string;
  avatarUri: string | null;
  onPressProfile: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName = 'Pengguna',
  avatarUri,
  onPressProfile,
}) => {
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <View style={styles.brandRow}>
          <Text style={[styles.appName, { color: colors.isDark ? '#FFFFFF' : colors.primary }]}>Finora</Text>
          <View style={[styles.brandDot, { backgroundColor: colors.secondary }]} />
        </View>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Halo, {userName} 👋</Text>
      </View>
      <TouchableOpacity
        style={[styles.avatarTouchable, { borderColor: colors.isDark ? '#28543E' : 'rgba(82, 183, 136, 0.3)' }]}
        activeOpacity={0.8}
        onPress={onPressProfile}
      >
        <View style={[styles.avatar, { backgroundColor: colors.isDark ? '#1C3328' : colors.primary }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.isDark ? colors.secondary : '#FFFFFF' }]}>
              {userName.charAt(0)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: LAYOUT.statusBarHeight + 8,
    paddingBottom: 12,
    paddingHorizontal: LAYOUT.screenGutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
    marginBottom: 4,
  },
  appName: {
    fontFamily: FONT.bold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  greeting: {
    fontFamily: FONT.medium,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarTouchable: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: FONT.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
