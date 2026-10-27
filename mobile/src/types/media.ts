/**
 * Domain types for BoxXMedia.
 *
 * These replace the Java model classes in the original app:
 *  - `Song`      -> DeviceAudioTrack
 *  - `Movie`     -> DeviceVideoTrack
 *  - `SongUrl`   -> UrlMedia (kind: 'audio')
 *  - `MovieUrl`  -> UrlMedia (kind: 'video')
 *
 * The original kept `SongUrl`/`MovieUrl` as two near-identical Parcelable
 * classes; here both are one `UrlMedia` shape discriminated by `kind`.
 */

/** Which of the two user-managed URL collections a record belongs to. */
export type UrlMediaKind = 'audio' | 'video';

/** A title + remote URL pair stored locally (SQLite) by the user. */
export interface UrlMedia {
  id: number;
  kind: UrlMediaKind;
  title: string;
  url: string;
  /** Unix epoch (ms). Added so lists have a stable secondary sort. */
  createdAt: number;
}

/**
 * A playable audio item.
 *
 * Deliberately covers both sources: a song found in the device media store
 * (`file://` / `ph://` URI) and a saved URL entry (`http(s)://`). That lets one
 * player queue - and therefore one set of controls, shuffle, repeat and
 * background playback - serve both, which the original app could not do: its
 * device playback went through `SongService` while URL playback used a
 * throwaway `SimpleExoPlayer` inside `PlayerAudioActivity`.
 */
export interface AudioTrack {
  /** Media store asset id, or `url-<id>` for a saved URL entry. */
  id: string;
  /** Playable URI: local for device media, `http(s)://` for streams. */
  uri: string;
  title: string;
  /** Duration in seconds; `0` when the platform has not resolved it yet. */
  durationSec: number;
}

/** A video discovered on the device through the system media store. */
export interface DeviceVideoTrack {
  id: string;
  uri: string;
  title: string;
  durationSec: number;
  width: number;
  height: number;
}

/** Repeat behaviour for the audio queue. The original only had on/off. */
export type RepeatMode = 'off' | 'all' | 'one';

/** Where a media player screen got its source from. */
export type MediaOrigin = 'device' | 'url';
