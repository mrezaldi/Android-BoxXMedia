import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from './IconButton';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

interface ActionCardProps {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
}

/**
 * The two big cards per tab ("RAW AUDIO" / "URL AUDIO").
 * Replaces the `CardView` + centred `TextView` pairs in `fragment_audio.xml`
 * and `fragment_video.xml`.
 */
export function ActionCard({ title, description, icon, onPress }: ActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={colors.accent} />
      </View>

      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    lineHeight: 17,
  },
});
