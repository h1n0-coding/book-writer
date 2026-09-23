import { getDb } from "../client";
import { Chapter, ChapterSchema, ChapterStatus } from "../../types/db";

interface ChapterRow {
  id: string;
  book_id: string;
  title: string;
  sort_order: number;
  synopsis: string;
  status: string;
  target_word_count: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ChapterRow): Chapter {
  return ChapterSchema.parse({
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    sortOrder: row.sort_order,
    synopsis: row.synopsis,
    status: row.status,
    targetWordCount: row.target_word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createChapter(
  bookId: string,
  title: string,
): Promise<Chapter> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const existing = await db.select<{ maxOrder: number | null }[]>(
    "SELECT MAX(sort_order) as maxOrder FROM chapters WHERE book_id = $1",
    [bookId],
  );
  const nextOrder = (existing[0]?.maxOrder ?? -1) + 1;

  await db.execute(
    `INSERT INTO chapters (id, book_id, title, sort_order, synopsis, status, target_word_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, '', 'draft', 0, $5, $5)`,
    [id, bookId, title, nextOrder, now],
  );

  return {
    id,
    bookId,
    title,
    sortOrder: nextOrder,
    synopsis: "",
    status: "draft",
    targetWordCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listChaptersByBook(bookId: string): Promise<Chapter[]> {
  const db = await getDb();
  const rows = await db.select<ChapterRow[]>(
    "SELECT * FROM chapters WHERE book_id = $1 ORDER BY sort_order ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface ChapterUpdateFields {
  title: string;
  synopsis: string;
  status: ChapterStatus;
  targetWordCount: number;
}

export async function updateChapter(
  id: string,
  fields: ChapterUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE chapters SET title = $1, synopsis = $2, status = $3, target_word_count = $4, updated_at = $5 WHERE id = $6`,
    [fields.title, fields.synopsis, fields.status, fields.targetWordCount, now, id],
  );
}

export async function renameChapter(id: string, title: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE chapters SET title = $1, updated_at = $2 WHERE id = $3",
    [title, now, id],
  );
}

export async function deleteChapter(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM chapters WHERE id = $1", [id]);
}

export async function moveChapter(
  bookId: string,
  chapterId: string,
  direction: "up" | "down",
): Promise<void> {
  const db = await getDb();
  const chapters = await listChaptersByBook(bookId);
  const index = chapters.findIndex((c) => c.id === chapterId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= chapters.length) return;

  const current = chapters[index];
  const swapWith = chapters[swapIndex];
  const now = new Date().toISOString();

  await db.execute(
    "UPDATE chapters SET sort_order = $1, updated_at = $2 WHERE id = $3",
    [swapWith.sortOrder, now, current.id],
  );
  await db.execute(
    "UPDATE chapters SET sort_order = $1, updated_at = $2 WHERE id = $3",
    [current.sortOrder, now, swapWith.id],
  );
}