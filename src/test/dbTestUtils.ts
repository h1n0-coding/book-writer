import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../../src-tauri/migrations");

const MIGRATION_FILES = [
  "0001_initial.sql",
  "0002_chapters_scenes.sql",
  "0003_characters.sql",
  "0004_locations.sql",
  "0005_events.sql",
  "0006_notes.sql",
  "0007_character_relationships.sql",
  "0008_events_extended.sql",
  "0009_event_positions.sql",
  "0010_character_wiki.sql",
];

// The app's repositories issue SQL using plugin-sql's `$1, $2, ...`
// placeholder syntax. node:sqlite expects `?`. This converts between the
// two, correctly handling a parameter that's referenced more than once
// (e.g. `WHERE from_id = $1 OR to_id = $1`) by re-reading it from the
// original params array at every occurrence rather than assuming each
// placeholder is used exactly once.
function toSqliteQuery(
  sql: string,
  params: unknown[],
): { sql: string; params: unknown[] } {
  const newParams: unknown[] = [];
  const newSql = sql.replace(/\$(\d+)/g, (_match, numStr: string) => {
    newParams.push(params[Number(numStr) - 1]);
    return "?";
  });
  return { sql: newSql, params: newParams };
}

export interface TestDb {
  execute: (sql: string, params?: unknown[]) => Promise<{ rowsAffected: number }>;
  select: <T>(sql: string, params?: unknown[]) => Promise<T>;
}

/**
 * Creates a fresh in-memory SQLite database and applies migrations in
 * order. Pass `migrationCount` to stop partway through — used by the
 * migration-continuity test to simulate an "older" schema version.
 */
export function createTestDb(migrationCount = MIGRATION_FILES.length): TestDb {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");

  for (const file of MIGRATION_FILES.slice(0, migrationCount)) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    raw.exec(sql);
  }

  return {
    async execute(sql, params = []) {
      const { sql: q, params: p } = toSqliteQuery(sql, params);
      const info = raw.prepare(q).run(...(p as never[]));
      return { rowsAffected: Number(info.changes) };
    },
    async select<T>(sql: string, params: unknown[] = []) {
      const { sql: q, params: p } = toSqliteQuery(sql, params);
      return raw.prepare(q).all(...(p as never[])) as T;
    },
  };
}