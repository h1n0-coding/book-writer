import { getDb } from "../client";
import { Book, BookSchema } from "../../types/db";

interface BookRow {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: BookRow): Book {
  return BookSchema.parse({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createBook(
  projectId: string,
  title: string,
): Promise<Book> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    "INSERT INTO books (id, project_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
    [id, projectId, title, now, now],
  );

  return { id, projectId, title, createdAt: now, updatedAt: now };
}

export async function listBooksByProject(projectId: string): Promise<Book[]> {
  const db = await getDb();
  const rows = await db.select<BookRow[]>(
    "SELECT id, project_id, title, created_at, updated_at FROM books WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId],
  );
  return rows.map(mapRow);
}

export async function getBookById(id: string): Promise<Book | null> {
  const db = await getDb();
  const rows = await db.select<BookRow[]>(
    "SELECT id, project_id, title, created_at, updated_at FROM books WHERE id = $1",
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}