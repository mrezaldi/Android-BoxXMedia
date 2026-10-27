import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from './IconButton';
import type { UrlMedia } from '../types/media';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

interface UrlMediaRowProps {
  item: UrlMedia;
  onPlay: () => void;
  onEdit: () => void;
  onShare: () => void;
}

/**
 * One saved URL entry.
 *
 * `SongUrlAdapter`/`MovieUrlAdapter` and `item_url_song.xml`/`item_url_video.xml`
 * were duplicates of each other; this single row serves both kinds.
 */
export function UrlMediaRow({ item, onPlay, onEdit, onShare }: UrlMediaRowProps) {
  const icon = item.kind === 'audio' ? 'musical-notes' : 'videocam';

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${item.title}`}
        onPress={onPlay}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color={colors.accent} />
        </View>

        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.url} numberOfLines={1}>
            {item.url}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <IconButton
          name="play"
          accessibilityLabel={`Play ${item.title}`}
          onPress={onPlay}
          size={20}
        />
        <IconButton
          name="create"
          accessibilityLabel={`Edit ${item.title}`}
          onPress={onEdit}
          size={20}
        />
        <IconButton
          name="share-social"
          accessibilityLabel={`Share ${item.title}`}
          onPress={onShare}
          size={20}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
  },
  url: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
});
