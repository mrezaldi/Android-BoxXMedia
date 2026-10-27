import * as MediaLibrary from 'expo-media-library/legacy';

import type { AudioTrack, DeviceVideoTrack } from '../types/media';
import { formatMediaTitle } from '../utils/format';

/**
 * Device media discovery.
 *
 * Replaces the raw `ContentResolver` + `MediaStore.Audio/Video` cursor
 * queries in `RawAudioActivity` / `RawVideoActivity` with the cross-platform
 * media library API, so the same code works on Android and iOS.
 *
 * Note: the media library asset type exposes `id`, `uri`, `filename`,
 * `duration` and dimensions - but no title or artist. The display title is
 * therefore derived from the file name (see `formatMediaTitle`).
 */

/** Assets fetched per page. */
const PAGE_SIZE = 200;
/** Safety cap so a huge library cannot lock the JS thread. */
const MAX_ASSETS = 2000;

/**
 * Asks for read access to audio *and* video.
 * Returns `true` when the user granted access.
 */
export async function requestMediaAccess(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync(false, ['audio', 'video']);

  if (current.granted) {
    return true;
  }

  if (!current.canAskAgain) {
    return false;
  }

  const requested = await MediaLibrary.requestPermissionsAsync(false, ['audio', 'video']);

  return requested.granted;
}

/** Walks every page of the media store for `mediaType`. */
async function fetchAllAssets(mediaType: 'audio' | 'video'): Promise<MediaLibrary.Asset[]> {
  const collected: MediaLibrary.Asset[] = [];
  let after: string | undefined;

  // Bounded loop: pages are finite and MAX_ASSETS short-circuits long libraries.
  for (;;) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: PAGE_SIZE,
      after,
    });

    collected.push(...page.assets);

    if (!page.hasNextPage || collected.length >= MAX_ASSETS || !page.endCursor) {
      break;
    }

    after = page.endCursor;
  }

  return collected;
}

function byTitle<T extends { title: string }>(a: T, b: T): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
}

/** Every song on the device, sorted by title. */
export async function listDeviceAudioTracks(): Promise<AudioTrack[]> {
  const assets = await fetchAllAssets('audio');

  return assets
    .map<AudioTrack>((asset) => ({
      id: asset.id,
      uri: asset.uri,
      title: formatMediaTitle(asset.filename),
      durationSec: Number.isFinite(asset.duration) ? asset.duration : 0,
    }))
    .sort(byTitle);
}

/** Every video on the device, sorted by title. */
export async function listDeviceVideoTracks(): Promise<DeviceVideoTrack[]> {
  const assets = await fetchAllAssets('video');

  return assets
    .map<DeviceVideoTrack>((asset) => ({
      id: asset.id,
      uri: asset.uri,
      title: formatMediaTitle(asset.filename),
      durationSec: Number.isFinite(asset.duration) ? asset.duration : 0,
      width: asset.width,
      height: asset.height,
    }))
    .sort(byTitle);
}
