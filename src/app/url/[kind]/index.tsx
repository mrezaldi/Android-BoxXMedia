import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Share, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { IconButton } from '../../../components/IconButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SectionState } from '../../../components/SectionState';
import { UrlMediaRow } from '../../../components/UrlMediaRow';
import { listUrlMedia } from '../../../db/urlMediaRepo';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/layout';
import type { UrlMedia } from '../../../types/media';
import { isUrlMediaKind, urlMediaKindLabel } from '../../../utils/urlMedia';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Saved URL entries.
 *
 * Replaces `UrlAudioActivity` + `UrlVideoActivity`. Those two classes were the
 * same screen duplicated for two tables, including the same
 * `onActivityResult` + `AsyncTask` reload dance. Here one route handles both
 * kinds, and the list simply reloads when the screen regains focus instead of
 * unwinding result codes back from the form.
 */
export default function UrlMediaListScreen() {
  const params = useLocalSearchParams<{ kind: string }>();
  const kind = isUrlMediaKind(params.kind) ? params.kind : null;

  const db = useSQLiteContext();
  const router = useRouter();

  const [items, setItems] = useState<UrlMedia[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    if (!kind) {
      return;
    }

    setLoadState('loading');

    try {
      setItems(await listUrlMedia(db, kind));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [db, kind]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!kind) {
    return (
      <ScreenContainer>
        <AppHeader title="Unknown collection" onBack={() => router.back()} />
        <SectionState
          icon="alert-circle"
          title="Unsupported media kind"
          message="This route only supports /url/audio and /url/video."
        />
      </ScreenContainer>
    );
  }

  const label = urlMediaKindLabel(kind);

  const shareItem = (item: UrlMedia) => {
    void Share.share({
      title: item.title,
      message: `${item.title}\n${item.url}`,
    });
  };

  const playItem = (item: UrlMedia) => {
    if (kind === 'audio') {
      router.push({ pathname: '/player/audio', params: { id: String(item.id) } });
      return;
    }

    router.push({
      pathname: '/player/video',
      params: { uri: item.url, title: item.title, origin: 'url' },
    });
  };

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader
        title={`URL ${label}`}
        subtitle={loadState === 'ready' ? `${items.length} saved` : 'Saved links'}
        onBack={() => router.back()}
        right={
          <IconButton
            name="add"
            accessibilityLabel={`Add ${label.toLowerCase()}`}
            onPress={() => router.push({ pathname: '/url/[kind]/edit', params: { kind } })}
          />
        }
      />

      <View style={styles.listArea}>
        {loadState === 'loading' ? <SectionState loading title="Loading saved links" /> : null}

        {loadState === 'error' ? (
          <SectionState
            icon="alert-circle"
            title="Could not read saved links"
            message="The local database query failed."
            actionLabel="Retry"
            onAction={() => void load()}
          />
        ) : null}

        {loadState === 'ready' && items.length === 0 ? (
          <SectionState
            icon={kind === 'audio' ? 'musical-notes' : 'videocam'}
            title={`No URL ${label.toLowerCase()} yet`}
            message="Add a link to stream it later, or play it straight away."
            actionLabel={`Add ${label.toLowerCase()}`}
            onAction={() => router.push({ pathname: '/url/[kind]/edit', params: { kind } })}
          />
        ) : null}

        {loadState === 'ready' && items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <UrlMediaRow
                item={item}
                onPlay={() => playItem(item)}
                onEdit={() =>
                  router.push({
                    pathname: '/url/[kind]/edit',
                    params: { kind, id: String(item.id) },
                  })
                }
                onShare={() => shareItem(item)}
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
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
});
