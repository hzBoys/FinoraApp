import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type AdvisorCardProps = {
  title?: string;
  body: string;
  note?: string;
  isAiGenerated?: boolean;
  isRefreshingAi?: boolean;
  onRefreshAi?: () => void;
};

export const AdvisorCard: React.FC<AdvisorCardProps> = ({
  title = 'Analisis Arus Kas & Anggaran',
  body,
  note,
  isAiGenerated = false,
  isRefreshingAi = false,
  onRefreshAi,
}) => {
  const { colors } = useThemeContext();

  const resolvedNote =
    note ??
    (isAiGenerated
      ? 'Rekomendasi personal Gemini AI berbasis rasio 60/20/20 Finora'
      : 'Rekomendasi otomatis berbasis rasio 60/20/20 Finora');

  return (
    <View style={[styles.advisorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CategoryIconBadge categoryOrType="Advisor" size={32} iconSize={16} borderRadius={8} />
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.advisorTitle,
              { color: colors.isDark ? colors.secondary : colors.primary, flex: 1 },
            ]}
          >
            {title}
          </Text>

          {onRefreshAi && (
            <TouchableOpacity
              style={[
                styles.aiBtn,
                {
                  backgroundColor: colors.isDark ? '#1C4032' : colors.mintBg,
                  borderColor: colors.isDark ? colors.secondary : colors.mintBorder,
                },
              ]}
              onPress={onRefreshAi}
              disabled={isRefreshingAi}
              activeOpacity={0.8}
            >
              {isRefreshingAi ? (
                <ActivityIndicator
                  size="small"
                  color={colors.isDark ? colors.secondary : colors.primary}
                />
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={colors.isDark ? colors.secondary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.aiBtnText,
                      { color: colors.isDark ? colors.secondary : colors.primary },
                    ]}
                  >
                    Analisis AI
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.advisorBody, { color: colors.textSecondary }]}>{body}</Text>
        <Text style={[styles.advisorNote, { color: colors.textMuted }]}>{resolvedNote}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  advisorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  advisorTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 78,
    justifyContent: 'center',
  },
  aiBtnText: {
    fontFamily: FONT.bold,
    fontSize: 10,
    fontWeight: '700',
  },
  advisorBody: {
    fontFamily: FONT.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  advisorNote: {
    fontFamily: FONT.regular,
    fontSize: 10,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
