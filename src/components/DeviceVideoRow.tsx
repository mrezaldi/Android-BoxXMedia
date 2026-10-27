import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DeviceVideoTrack } from '../types/media';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';
import { formatDuration } from '../utils/format';

interface DeviceVideoRowProps {
  track: DeviceVideoTrack;
  onPress: () => void;
}

/**
 * A row in the device video list.
 *
 * Replaces `item_movie.xml` + `MovieRawAdapter`. The original pulled a
 * `MediaStore.Video.Thumbnails` bitmap for every row; the cross-platform
 * equivalent needs a video player instance per item, so this renders a
 * placeholder tile with the duration and resolution instead. See the README
 * for the follow-up path (`VideoPlayer.generateThumbnailsAsync` + expo-image).
 */
export function DeviceVideoRow({ track, onPress }: DeviceVideoRowProps) {
  const resolution =
    track.width > 0 && track.height > 0 ? `${track.width}x${track.height}` : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={track.title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.thumbnail}>
        <Ionicons name="videocam" size={22} color={colors.accent} />
        <Text style={styles.duration}>{formatDuration(track.durationSec)}</Text>
      </View>

      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {track.title}
        </Text>
        {resolution ? <Text style={styles.meta}>{resolution}</Text> : null}
      </View>

      <Ionicons name="play-circle" size={26} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 84,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  duration: {
    color: colors.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
});
