import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { IconButton } from '../../components/IconButton';
import { ProgressSlider } from '../../components/ProgressSlider';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionState } from '../../components/SectionState';
import { listUrlMedia } from '../../db/urlMediaRepo';
import { useAudioControls, useAudioPlayback } from '../../state/AudioPlayerContext';
import { colors } from '../../theme/colors';
import { fontSize, radius, spacing } from '../../theme/layout';
import type { AudioTrack } from '../../types/media';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/**
 * URL audio player.
 *
 * Replaces `PlayerAudioActivity`. The original spun up a throwaway
 * `SimpleExoPlayer` for a single `SongUrl`, so playback died with the screen.
 * Here the whole saved list becomes the shared player queue: next/previous move
 * through every saved link and playback continues in the background with
 * lock screen controls.
 */
export default function UrlAudioPlayerScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const requestedId = typeof params.id === 'string' ? params.id : null;

  const db = useSQLiteContext();
  const router = useRouter();
  const controls = useAudioControls();
  const playback = useAudioPlayback();

  const [loadState, setLoadState] = useState<LoadState>('loading');

  // Keep the latest playQueue in a ref so the loading effect does not re-run
  // (and therefore never restarts playback) when the controls object changes.
  const playQueueRef = useRef(controls.playQueue);

  useEffect(() => {
    playQueueRef.current = controls.playQueue;
  }, [controls.playQueue]);

  const startedForRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const items = await listUrlMedia(db, 'audio');

        if (cancelled) {
          return;
        }

        if (items.length === 0) {
          setLoadState('missing');
          return;
        }

        const queue: AudioTrack[] = items.map((item) => ({
          id: `url-${item.id}`,
          uri: item.url,
          title: item.title,
          durationSec: 0,
        }));

        const foundIndex = queue.findIndex((track) => track.id === `url-${requestedId}`);
        const startIndex = foundIndex >= 0 ? foundIndex : 0;

        setLoadState('ready');

        if (startedForRef.current !== requestedId) {
          startedForRef.current = requestedId;
          playQueueRef.current(queue, startIndex);
        }
      } catch {
        if (!cancelled) {
          setLoadState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, requestedId]);

  const repeatLabel =
    playback.repeatMode === 'off' ? 'Off' : playback.repeatMode === 'all' ? 'All' : 'One';

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader title="Now Playing" subtitle="URL audio" onBack={() => router.back()} />

      {loadState !== 'ready' ? (
        <View style={styles.centered}>
          {loadState === 'loading' ? <SectionState loading title="Preparing playback" /> : null}
          {loadState === 'missing' ? (
            <SectionState
              icon="musical-notes"
              title="Nothing to play"
              message="There are no saved URL audio entries yet."
              actionLabel="Add one"
              onAction={() => router.replace('/url/audio')}
            />
          ) : null}
          {loadState === 'error' ? (
            <SectionState
              icon="alert-circle"
              title="Could not open the stream list"
              message="The local database query failed."
              actionLabel="Back"
              onAction={() => router.back()}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.artwork}>
            <Ionicons name="musical-notes" size={72} color={colors.accent} />
          </View>

          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={2}>
              {playback.currentTrack?.title ?? 'URL audio'}
            </Text>
            <Text style={styles.url} numberOfLines={1}>
              {playback.currentTrack?.uri ?? ''}
            </Text>
          </View>

          <ProgressSlider
            positionSec={playback.positionSec}
            durationSec={playback.durationSec}
            onSeek={controls.seekTo}
          />

          <View style={styles.transport}>
            <IconButton
              name="shuffle"
              accessibilityLabel="Toggle shuffle"
              active={playback.shuffleEnabled}
              onPress={controls.toggleShuffle}
              size={22}
            />
            <IconButton
              name="play-skip-back"
              accessibilityLabel="Previous track"
              onPress={controls.playPrevious}
            />
            <IconButton
              name={playback.isPlaying ? 'pause' : 'play'}
              accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}
              onPress={controls.togglePlayPause}
              filled
              size={30}
            />
            <IconButton
              name="play-skip-forward"
              accessibilityLabel="Next track"
              onPress={controls.playNext}
            />
            <IconButton name="stop" accessibilityLabel="Stop playback" onPress={controls.stop} />
          </View>

          <View style={styles.secondary}>
            <IconButton
              name="repeat"
              accessibilityLabel={`Repeat ${repeatLabel}`}
              active={playback.repeatMode !== 'off'}
              onPress={controls.cycleRepeatMode}
              size={20}
            />
            <Text style={styles.secondaryLabel}>Repeat {repeatLabel}</Text>
            <Text style={styles.secondaryLabel}>{playback.queue.length} in queue</Text>
          </View>

          {playback.isBuffering ? <Text style={styles.hint}>Buffering…</Text> : null}

          {playback.error ? (
            <Text style={styles.error} numberOfLines={3}>
              Playback error: {playback.error}
            </Text>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: 190,
    height: 190,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  titles: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  url: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.sm,
  },
  secondaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});
