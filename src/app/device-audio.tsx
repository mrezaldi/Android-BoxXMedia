import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { DeviceAudioRow } from '../components/DeviceAudioRow';
import { IconButton } from '../components/IconButton';
import { ProgressSlider } from '../components/ProgressSlider';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionState } from '../components/SectionState';
import { listDeviceAudioTracks, requestMediaAccess } from '../services/mediaLibrary';
import { useAudioControls, useAudioPlayback } from '../state/AudioPlayerContext';
import { colors } from '../theme/colors';
import { fontSize, spacing } from '../theme/layout';
import type { AudioTrack } from '../types/media';

type LoadState = 'loading' | 'ready' | 'denied' | 'error';

/**
 * Device audio.
 *
 * Replaces `RawAudioActivity` + `SongService` + the `ServiceConnection`
 * plumbing. The list itself is now only responsible for *fetching* tracks;
 * every playback control delegates to the shared player context, so the same
 * playback keeps running when this screen is popped.
 */
export default function DeviceAudioScreen() {
  const router = useRouter();
  const controls = useAudioControls();
  const playback = useAudioPlayback();

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  /** Refresh: the handler owns the loading state, the effect only fetches. */
  const reload = useCallback(() => {
    setLoadState('loading');
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const granted = await requestMediaAccess();

        if (cancelled) {
          return;
        }

        if (!granted) {
          setLoadState('denied');
          return;
        }

        const found = await listDeviceAudioTracks();

        if (cancelled) {
          return;
        }

        setTracks(found);
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setLoadState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const playAt = useCallback(
    (index: number) => {
      controls.playQueue(tracks, index);
    },
    [controls, tracks]
  );

  const repeatLabel =
    playback.repeatMode === 'off' ? 'Off' : playback.repeatMode === 'all' ? 'All' : 'One';

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader
        title="Raw Audio"
        subtitle={loadState === 'ready' ? `${tracks.length} songs on device` : 'Device media'}
        onBack={() => router.back()}
        right={
          <IconButton name="refresh" accessibilityLabel="Reload songs" onPress={reload} />
        }
      />

      <View style={styles.listArea}>
        {loadState === 'loading' ? (
          <SectionState loading title="Scanning your library" />
        ) : null}

        {loadState === 'denied' ? (
          <SectionState
            icon="lock-closed"
            title="Media permission needed"
            message="BoxXMedia needs read access to your audio files to list them."
            actionLabel="Try again"
            onAction={reload}
          />
        ) : null}

        {loadState === 'error' ? (
          <SectionState
            icon="alert-circle"
            title="Could not read your library"
            message="Something went wrong while querying device audio."
            actionLabel="Retry"
            onAction={reload}
          />
        ) : null}

        {loadState === 'ready' && tracks.length === 0 ? (
          <SectionState
            icon="musical-notes"
            title="No songs found"
            message="No audio files were found on this device."
            actionLabel="Reload"
            onAction={reload}
          />
        ) : null}

        {loadState === 'ready' && tracks.length > 0 ? (
          <FlatList
            data={tracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item, index }) => (
              <DeviceAudioRow
                track={item}
                isCurrent={playback.currentTrack?.id === item.id}
                isPlaying={playback.isPlaying}
                onPress={() => playAt(index)}
              />
            )}
          />
        ) : null}
      </View>

      {playback.currentTrack ? (
        <View style={styles.player}>
          <View style={styles.playerTop}>
            <View style={styles.playerTitles}>
              <Text style={styles.nowPlayingLabel}>Now playing</Text>
              <Text style={styles.playerTitle} numberOfLines={1}>
                {playback.currentTrack.title}
              </Text>
            </View>
            <IconButton
              name={playback.isBuffering ? 'hourglass' : 'list'}
              accessibilityLabel="Show queue length"
              onPress={() => undefined}
              disabled
              size={18}
            />
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
              accessibilityLabel="Previous song"
              onPress={controls.playPrevious}
            />
            <IconButton
              name={playback.isPlaying ? 'pause' : 'play'}
              accessibilityLabel={playback.isPlaying ? 'Pause' : 'Play'}
              onPress={controls.togglePlayPause}
              filled
              size={28}
            />
            <IconButton
              name="play-skip-forward"
              accessibilityLabel="Next song"
              onPress={controls.playNext}
            />
            <IconButton
              name="stop"
              accessibilityLabel="Stop playback"
              onPress={controls.stop}
            />
          </View>

          <View style={styles.secondaryTransport}>
            <IconButton
              name="repeat"
              accessibilityLabel={`Repeat ${repeatLabel}`}
              active={playback.repeatMode !== 'off'}
              onPress={controls.cycleRepeatMode}
              size={20}
            />
            <Text style={styles.repeatLabel}>Repeat {repeatLabel}</Text>
            <Text style={styles.queueLabel}>{playback.queue.length} in queue</Text>
          </View>

          {playback.error ? (
            <Text style={styles.error} numberOfLines={2}>
              Playback error: {playback.error}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Tap a song to start playing. Playback keeps running in the background.
          </Text>
          <Text style={styles.hintLink} onPress={() => void Linking.openSettings()}>
            Manage permissions
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  player: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTitles: {
    flex: 1,
  },
  nowPlayingLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  playerTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    marginTop: 2,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  secondaryTransport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  repeatLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  queueLabel: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
  },
  hint: {
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  hintLink: {
    color: colors.accent,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
});
