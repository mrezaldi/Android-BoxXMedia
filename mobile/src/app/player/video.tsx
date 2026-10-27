import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer, type ContentType, type VideoSource } from 'expo-video';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionState } from '../../components/SectionState';
import { colors } from '../../theme/colors';
import { fontSize, radius, spacing } from '../../theme/layout';

/**
 * Guesses the container from the file extension.
 *
 * `PlayerVideoActivity` branched on `Util.inferContentType` to pick between
 * DASH, SmoothStreaming, HLS and progressive sources. `expo-video` does the
 * same inference but accepts an explicit `contentType` hint, which is what
 * this returns. DASH and SmoothStreaming remain Android-only.
 */
function inferContentType(uri: string): ContentType {
  const withoutQuery = uri.split(/[?#]/)[0]?.toLowerCase() ?? '';

  if (withoutQuery.endsWith('.m3u8')) {
    return 'hls';
  }

  if (withoutQuery.endsWith('.mpd')) {
    return 'dash';
  }

  if (withoutQuery.endsWith('.ism') || withoutQuery.endsWith('.isml')) {
    return 'smoothStreaming';
  }

  return 'auto';
}

/**
 * Video player.
 *
 * Replaces `PlayerVideoActivity`. The original resolved device videos by
 * re-querying `MediaStore` for a filesystem path and URL videos by passing a
 * `MovieUrl` Parcelable; both cases reduce to a single URI here, so one screen
 * serves the device list and the saved URL list.
 *
 * Fullscreen and the transport controls come from the native player UI, which
 * covers what the original's `PlayerView` + `hideSystemUi()` did by hand.
 */
export default function VideoPlayerScreen() {
  const params = useLocalSearchParams<{ uri?: string; title?: string; origin?: string }>();
  const router = useRouter();

  const uri = typeof params.uri === 'string' ? params.uri : '';
  const title =
    typeof params.title === 'string' && params.title.trim().length > 0
      ? params.title
      : 'Video player';
  const origin = params.origin === 'url' ? 'Streaming from a saved link' : 'Playing from this device';

  const hasSource = uri.length > 0;

  const source = useMemo<VideoSource | null>(
    () => (hasSource ? { uri, contentType: inferContentType(uri) } : null),
    [hasSource, uri]
  );

  const player = useVideoPlayer(source, (instance) => {
    instance.play();
  });

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader title={title} subtitle={origin} onBack={() => router.back()} />

      {hasSource ? (
        <View style={styles.body}>
          <View style={styles.stage}>
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
              contentFit="contain"
              fullscreenOptions={{ enable: true }}
            />
          </View>

          <Text style={styles.uri} numberOfLines={2}>
            {uri}
          </Text>
          <Text style={styles.hint}>
            Tap the player for native controls. HLS (.m3u8) and progressive files play on both
            platforms; DASH (.mpd) and SmoothStreaming are Android-only.
          </Text>
        </View>
      ) : (
        <SectionState
          icon="alert-circle"
          title="No video source"
          message="Open a video from the device list or from a saved URL entry."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  uri: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    lineHeight: 17,
  },
});
