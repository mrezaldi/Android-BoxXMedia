import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AudioTrack } from '../types/media';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';
import { formatDuration } from '../utils/format';

interface DeviceAudioRowProps {
  track: AudioTrack;
  isCurrent: boolean;
  isPlaying: boolean;
  onPress: () => void;
}

/**
 * A row in the device song list.
 *
 * Replaces `item_song.xml` + `SongRawAdapter`. The original only showed a
 * title and an artist that the cross-platform media API cannot supply, so the
 * second line is the duration instead - and the row highlights whichever
 * track is currently loaded in the player.
 */
export function DeviceAudioRow({
  track,
  isCurrent,
  isPlaying,
  onPress,
}: DeviceAudioRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={track.title}
      accessibilityState={{ selected: isCurrent }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, isCurrent && styles.rowCurrent, pressed && styles.pressed]}
    >
      <Ionicons
        name={isCurrent && isPlaying ? 'musical-notes' : 'musical-note'}
        size={20}
        color={isCurrent ? colors.accent : colors.textMuted}
      />

      <View style={styles.texts}>
        <Text style={[styles.title, isCurrent && styles.titleCurrent]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.meta}>{formatDuration(track.durationSec)}</Text>
      </View>

      {isCurrent && isPlaying ? (
        <Text style={styles.badge}>Playing</Text>
      ) : (
        <Ionicons name="play" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowCurrent: {
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  titleCurrent: {
    color: colors.accent,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  badge: {
    color: colors.accent,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
});
