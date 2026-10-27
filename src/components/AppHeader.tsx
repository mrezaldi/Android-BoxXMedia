import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from './IconButton';
import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/layout';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a back chevron when provided. */
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * Custom header.
 *
 * The original app themed the platform ActionBar through `styles.xml`
 * (`CustomActionBarAudio`). Native headers are hard to theme consistently
 * across iOS and Android, so screens render this instead with the stack
 * header hidden.
 */
export function AppHeader({ title, subtitle, onBack, right }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <IconButton
          name="chevron-back"
          accessibilityLabel="Go back"
          onPress={onBack}
          size={24}
          style={styles.backButton}
        />
      ) : null}

      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.xs,
  },
  titles: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
