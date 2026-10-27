import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SectionState } from '../../../components/SectionState';
import { TextField } from '../../../components/TextField';
import { getUrlMediaById, insertUrlMedia, removeUrlMedia, updateUrlMedia } from '../../../db/urlMediaRepo';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/layout';
import type { UrlMediaKind } from '../../../types/media';
import { isUrlMediaKind, urlMediaKindLabel } from '../../../utils/urlMedia';

interface FormErrors {
  title?: string;
  url?: string;
}

/** Any scheme is accepted (http, https, rtsp, file, ...). */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Add / edit a saved URL entry.
 *
 * Replaces `EditUrlSongActivity` + `EditUrlMovieActivity`. Fixed while porting:
 *  - the original kept `isEmpty` as an Activity field and never reset it, so
 *    after one failed save the form could never be submitted again;
 *  - the delete branch of the confirm dialog was unreachable (no UI ever
 *    called it), so entries could never be removed - there is a Delete button
 *    now;
 *  - `onBackPressed` finished the Activity *before* showing the discard
 *    dialog, so the prompt appeared over a dying screen.
 */
export default function EditUrlMediaScreen() {
  const params = useLocalSearchParams<{ kind: string; id?: string }>();
  const kind: UrlMediaKind | null = isUrlMediaKind(params.kind) ? params.kind : null;
  const editingId = params.id ? Number(params.id) : null;

  const db = useSQLiteContext();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(editingId !== null);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  /** Snapshot used to tell whether the user actually changed anything. */
  const [original, setOriginal] = useState({ title: '', url: '' });

  useEffect(() => {
    if (!kind || editingId === null) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const existing = await getUrlMediaById(db, kind, editingId);

      if (cancelled) {
        return;
      }

      if (!existing) {
        setMissing(true);
      } else {
        setTitle(existing.title);
        setUrl(existing.url);
        setOriginal({ title: existing.title, url: existing.url });
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [db, editingId, kind]);

  const isDirty =
    title !== original.title || url !== original.url;

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const confirmDiscard = useCallback(() => {
    if (!isDirty) {
      goBack();
      return;
    }

    Alert.alert('Discard changes?', 'Your edits to this entry will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: goBack },
    ]);
  }, [goBack, isDirty]);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (trimmedTitle.length === 0) {
      next.title = 'This field cannot be empty';
    }

    if (trimmedUrl.length === 0) {
      next.url = 'This field cannot be empty';
    } else if (!HAS_SCHEME.test(trimmedUrl)) {
      next.url = 'Include a scheme, for example https://';
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  }, [title, url]);

  const handleSave = useCallback(async () => {
    if (!kind || !validate()) {
      return;
    }

    setSaving(true);

    try {
      const payload = { title: title.trim(), url: url.trim() };

      if (editingId === null) {
        await insertUrlMedia(db, kind, payload);
      } else {
        await updateUrlMedia(db, kind, editingId, payload);
      }

      router.back();
    } catch {
      Alert.alert('Could not save', 'The entry could not be written to the local database.');
    } finally {
      setSaving(false);
    }
  }, [db, editingId, kind, router, title, url, validate]);

  const handleDelete = useCallback(() => {
    if (!kind || editingId === null) {
      return;
    }

    Alert.alert('Delete entry?', 'This removes the saved link from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeUrlMedia(db, kind, editingId);
              router.back();
            } catch {
              Alert.alert('Could not delete', 'The entry is still in the local database.');
            }
          })();
        },
      },
    ]);
  }, [db, editingId, kind, router]);

  if (!kind) {
    return (
      <ScreenContainer>
        <AppHeader title="Unknown collection" onBack={goBack} />
        <SectionState
          icon="alert-circle"
          title="Unsupported media kind"
          message="This route only supports /url/audio and /url/video."
        />
      </ScreenContainer>
    );
  }

  const label = urlMediaKindLabel(kind);
  const isEditing = editingId !== null;

  return (
    <ScreenContainer edges={['top']}>
      <AppHeader
        title={isEditing ? `Edit ${label}` : `Add ${label}`}
        subtitle={isEditing ? 'Update or remove this entry' : 'Save a link for later'}
        onBack={confirmDiscard}
      />

      {loading ? (
        <SectionState loading title="Loading entry" />
      ) : missing ? (
        <SectionState
          icon="alert-circle"
          title="Entry not found"
          message="It may have been deleted already."
          actionLabel="Back to list"
          onAction={goBack}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <TextField
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="My favourite stream"
              error={errors.title}
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextField
              label="URL"
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/stream.m3u8"
              error={errors.url}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.actions}>
              <PrimaryButton
                label={isEditing ? 'Save changes' : 'Save'}
                icon="save"
                onPress={() => void handleSave()}
                loading={saving}
              />
              <PrimaryButton
                label="Cancel"
                variant="secondary"
                onPress={confirmDiscard}
              />

              {isEditing ? (
                <PrimaryButton
                  label="Delete entry"
                  variant="danger"
                  icon="trash"
                  onPress={handleDelete}
                />
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
