import type { UrlMediaKind } from '../types/media';

const KINDS: readonly UrlMediaKind[] = ['audio', 'video'];

/** Narrows an untrusted route param (`/url/[kind]/...`) to a known kind. */
export function isUrlMediaKind(value: unknown): value is UrlMediaKind {
  return typeof value === 'string' && (KINDS as readonly string[]).includes(value);
}

/** `audio` -> `Audio`, used for screen titles. */
export function urlMediaKindLabel(kind: UrlMediaKind): string {
  return kind === 'audio' ? 'Audio' : 'Video';
}
