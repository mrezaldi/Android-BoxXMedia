import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { DeviceVideoRow } from '../components/DeviceVideoRow';
import { IconButton } from '../components/IconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionState } from '../components/SectionState';
import { listDeviceVideoTracks, requestMediaAccess } from '../services/mediaLibrary';
import { spacing } from '../theme/layout';
import type { DeviceVideoTrack } from '../types/media';

type LoadState = 'loading' | 'ready' | 'denied' | 'error';

/**
 * Device video.
 *
 * Replaces `RawVideoActivity`. The original queried `MediaStore.Video` and
 * then re-queried the same id inside `PlayerVideoActivity` to resolve a
 * filesystem path; here the track already carries a playable URI and the
 * player screen just receives it.
 */
export default function DeviceVideoScreen() {
  const router = useRouter();

  const [tracks, setTracks] = useState<DeviceVideoTrack[]>([]);
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

        const found = await listDeviceVideoTracks();

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

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader
        title="Raw Video"
        subtitle={loadState === 'ready' ? `${tracks.length} videos on device` : 'Device media'}
        onBack={() => router.back()}
        right={
          <IconButton name="refresh" accessibilityLabel="Reload videos" onPress={reload} />
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
            message="BoxXMedia needs read access to your videos to list them."
            actionLabel="Try again"
            onAction={reload}
          />
        ) : null}

        {loadState === 'error' ? (
          <SectionState
            icon="alert-circle"
            title="Could not read your library"
            message="Something went wrong while querying device video."
            actionLabel="Retry"
            onAction={reload}
          />
        ) : null}

        {loadState === 'ready' && tracks.length === 0 ? (
          <SectionState
            icon="videocam"
            title="No videos found"
            message="No video files were found on this device."
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
            renderItem={({ item }) => (
              <DeviceVideoRow
                track={item}
                onPress={() =>
                  router.push({
                    pathname: '/player/video',
                    params: { uri: item.uri, title: item.title, origin: 'device' },
                  })
                }
              />
            )}
          />
        ) : null}
      </View>
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
});
