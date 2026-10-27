import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from './IconButton';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

interface SectionStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Uniform placeholder for "loading", "nothing here" and "something broke".
 *
 * The original screens just popped a Snackbar with "Tidak ada data" and left
 * an empty list behind; a persistent state block is clearer.
 */
export function SectionState({
  title,
  message,
  icon = 'albums',
  loading = false,
  actionLabel,
  onAction,
}: SectionStateProps) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" />
      ) : (
        <Ionicons name={icon} size={44} color={colors.textMuted} />
      )}

      <Text style={styles.title}>{title}</Text>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  action: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
