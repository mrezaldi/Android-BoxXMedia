import type { SQLiteDatabase } from 'expo-sqlite';

import type { UrlMedia, UrlMediaKind } from '../types/media';

/**
 * Repository for the user-managed URL collections.
 *
 * Replaces `SongUrlHelper` + `VideoUrlHelper`. Those two classes were
 * byte-for-byte duplicates over two tables, so they collapse into one
 * parameterised module here.
 *
 * Every statement uses bound parameters. The original helpers built SQL by
 * string concatenation (`_ID + "= '" + id + "'"`), which is both fragile and
 * injectable.
 */

const TABLES: Record<UrlMediaKind, string> = {
  audio: 'url_audio',
  video: 'url_video',
};

interface UrlMediaRow {
  id: number;
  title: string;
  url: string;
  created_at: number;
}

function toUrlMedia(kind: UrlMediaKind, row: UrlMediaRow): UrlMedia {
  return {
    id: row.id,
    kind,
    title: row.title,
    url: row.url,
    createdAt: row.created_at,
  };
}

/** All saved records of `kind`, ordered by title (case-insensitive). */
export async function listUrlMedia(
  db: SQLiteDatabase,
  kind: UrlMediaKind
): Promise<UrlMedia[]> {
  const rows = await db.getAllAsync<UrlMediaRow>(
    `SELECT id, title, url, created_at
       FROM ${TABLES[kind]}
      ORDER BY title COLLATE NOCASE ASC, id ASC`
  );

  return rows.map((row) => toUrlMedia(kind, row));
}

/** A single record, or `null` when the id no longer exists. */
export async function getUrlMediaById(
  db: SQLiteDatabase,
  kind: UrlMediaKind,
  id: number
): Promise<UrlMedia | null> {
  const row = await db.getFirstAsync<UrlMediaRow>(
    `SELECT id, title, url, created_at FROM ${TABLES[kind]} WHERE id = ?`,
    id
  );

  return row ? toUrlMedia(kind, row) : null;
}

/** Inserts a record and returns it with its generated id. */
export async function insertUrlMedia(
  db: SQLiteDatabase,
  kind: UrlMediaKind,
  input: { title: string; url: string }
): Promise<UrlMedia> {
  const createdAt = Date.now();

  const result = await db.runAsync(
    `INSERT INTO ${TABLES[kind]} (title, url, created_at) VALUES (?, ?, ?)`,
    input.title,
    input.url,
    createdAt
  );

  return {
    id: result.lastInsertRowId,
    kind,
    title: input.title,
    url: input.url,
    createdAt,
  };
}

/** Overwrites the title and url of an existing record. */
export async function updateUrlMedia(
  db: SQLiteDatabase,
  kind: UrlMediaKind,
  id: number,
  input: { title: string; url: string }
): Promise<void> {
  await db.runAsync(
    `UPDATE ${TABLES[kind]} SET title = ?, url = ? WHERE id = ?`,
    input.title,
    input.url,
    id
  );
}

/** Deletes an existing record. */
export async function removeUrlMedia(
  db: SQLiteDatabase,
  kind: UrlMediaKind,
  id: number
): Promise<void> {
  await db.runAsync(`DELETE FROM ${TABLES[kind]} WHERE id = ?`, id);
}
