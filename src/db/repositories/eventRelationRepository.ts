import { getDb } from "../client";
import { EventRelation, EventRelationSchema } from "../../types/db";

interface EventRelationRow {
  id: string;
  book_id: string;
  from_event_id: string;
  to_event_id: string;
  type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventRelationRow): EventRelation {
  return EventRelationSchema.parse({
    id: row.id,
    bookId: row.book_id,
    fromEventId: row.from_event_id,
    toEventId: row.to_event_id,
    type: row.type,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createEventRelation(
  bookId: string,
  fromEventId: string,
  toEventId: string,
  type: string,
): Promise<EventRelation> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO event_relations (id, book_id, from_event_id, to_event_id, type, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, '', $6, $6)`,
    [id, bookId, fromEventId, toEventId, type, now],
  );

  return {
    id,
    bookId,
    fromEventId,
    toEventId,
    type,
    description: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listRelationsForEvent(
  eventId: string,
): Promise<EventRelation[]> {
  const db = await getDb();
  const rows = await db.select<EventRelationRow[]>(
    `SELECT * FROM event_relations
     WHERE from_event_id = $1 OR to_event_id = $1
     ORDER BY created_at ASC`,
    [eventId],
  );
  return rows.map(mapRow);
}

export async function listRelationsByBook(
  bookId: string,
): Promise<EventRelation[]> {
  const db = await getDb();
  const rows = await db.select<EventRelationRow[]>(
    "SELECT * FROM event_relations WHERE book_id = $1 ORDER BY created_at ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface EventRelationUpdateFields {
  type: string;
  description: string;
}

export async function updateEventRelation(
  id: string,
  fields: EventRelationUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE event_relations SET type = $1, description = $2, updated_at = $3 WHERE id = $4",
    [fields.type, fields.description, now, id],
  );
}

export async function deleteEventRelation(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM event_relations WHERE id = $1", [id]);
}