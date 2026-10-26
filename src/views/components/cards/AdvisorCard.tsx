import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '../../../context/ThemeContext';
import { FONT } from '../../../constants/typography';
import { CategoryIconBadge } from '../icons/CategoryIconBadge';

type AdvisorCardProps = {
  title?: string;
  body: string;
  note?: string;
};

export const AdvisorCard: React.FC<AdvisorCardProps> = ({
  title = 'Analisis Arus Kas & Anggaran',
  body,
  note = 'Rekomendasi otomatis berbasis rasio 60/20/20 Finora',
}) => {
  const { colors } = useThemeContext();

  return (
    <View style={[styles.advisorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <CategoryIconBadge categoryOrType="Advisor" size={32} iconSize={16} borderRadius={8} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.advisorTitle, { color: colors.isDark ? colors.secondary : colors.primary }]}>
          {title}
        </Text>
        <Text style={[styles.advisorBody, { color: colors.textSecondary }]}>{body}</Text>
        <Text style={[styles.advisorNote, { color: colors.textMuted }]}>{note}</Text>
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
  advisorTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
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
