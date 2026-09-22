import { getDb } from "../client";
import { Note, NoteSchema } from "../../types/db";

interface NoteRow {
  id: string;
  book_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: NoteRow): Note {
  return NoteSchema.parse({
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createNote(bookId: string, title: string): Promise<Note> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO notes (id, book_id, title, content, created_at, updated_at)
     VALUES ($1, $2, $3, '', $4, $4)`,
    [id, bookId, title, now],
  );

  return { id, bookId, title, content: "", createdAt: now, updatedAt: now };
}

export async function listNotesByBook(bookId: string): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.select<NoteRow[]>(
    "SELECT * FROM notes WHERE book_id = $1 ORDER BY updated_at DESC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface NoteUpdateFields {
  title: string;
  content: string;
}

export async function updateNote(
  id: string,
  fields: NoteUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE notes SET title = $1, content = $2, updated_at = $3 WHERE id = $4",
    [fields.title, fields.content, now, id],
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM notes WHERE id = $1", [id]);
}