import * as SQLite from 'expo-sqlite';

/**
 * Database bootstrap.
 *
 * Replaces `DbMediaHelper` (SQLiteOpenHelper) from the original app.
 *
 * Two things were fixed while porting the schema:
 *  1. `DbMediaContract.VideoColumns.URL_VIDEO` was accidentally declared as
 *     `"url_song"`, so the video table stored its URL in a column named after
 *     songs. The new schema uses `url` in both tables.
 *  2. An explicit `created_at` column was added so lists have a stable order.
 */

export const DATABASE_NAME = 'boxxmedia.db';

/** Bump this and add a matching block in `migrateDbIfNeeded` when the schema changes. */
const SCHEMA_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS url_audio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS url_video (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;

/**
 * Runs on every app start (wired into `SQLiteProvider`'s `onInit`).
 * Reads `PRAGMA user_version` to decide which migration blocks to run.
 */
export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(SCHEMA_V1);
  }

  // `PRAGMA` does not accept bound parameters; SCHEMA_VERSION is a module
  // constant, never user input.
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
