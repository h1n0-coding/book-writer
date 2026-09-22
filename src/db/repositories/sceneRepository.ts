import { getDb } from "../client";
import { Scene, SceneSchema } from "../../types/db";

interface SceneRow {
  id: string;
  chapter_id: string;
  title: string;
  sort_order: number;
  content: string;
  synopsis: string;
  pov_character_id: string | null;
  location_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: SceneRow): Scene {
  return SceneSchema.parse({
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    sortOrder: row.sort_order,
    content: row.content,
    synopsis: row.synopsis,
    povCharacterId: row.pov_character_id,
    locationId: row.location_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createScene(
  chapterId: string,
  title: string,
): Promise<Scene> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const existing = await db.select<{ maxOrder: number | null }[]>(
    "SELECT MAX(sort_order) as maxOrder FROM scenes WHERE chapter_id = $1",
    [chapterId],
  );
  const nextOrder = (existing[0]?.maxOrder ?? -1) + 1;

  await db.execute(
    `INSERT INTO scenes (id, chapter_id, title, sort_order, content, synopsis, pov_character_id, location_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, '', '', NULL, NULL, 'draft', $5, $5)`,
    [id, chapterId, title, nextOrder, now],
  );

  return {
    id,
    chapterId,
    title,
    sortOrder: nextOrder,
    content: "",
    synopsis: "",
    povCharacterId: null,
    locationId: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listScenesByChapter(chapterId: string): Promise<Scene[]> {
  const db = await getDb();
  const rows = await db.select<SceneRow[]>(
    "SELECT * FROM scenes WHERE chapter_id = $1 ORDER BY sort_order ASC",
    [chapterId],
  );
  return rows.map(mapRow);
}

export async function listScenesByBook(bookId: string): Promise<Scene[]> {
  const db = await getDb();
  const rows = await db.select<SceneRow[]>(
    `SELECT s.* FROM scenes s
     JOIN chapters c ON c.id = s.chapter_id
     WHERE c.book_id = $1
     ORDER BY c.sort_order ASC, s.sort_order ASC`,
    [bookId],
  );
  return rows.map(mapRow);
}

export async function getSceneById(id: string): Promise<Scene | null> {
  const db = await getDb();
  const rows = await db.select<SceneRow[]>(
    "SELECT * FROM scenes WHERE id = $1",
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateSceneContent(
  id: string,
  content: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE scenes SET content = $1, updated_at = $2 WHERE id = $3",
    [content, now, id],
  );
}