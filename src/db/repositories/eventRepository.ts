import { getDb } from "../client";
import { Event, EventSchema } from "../../types/db";
import type { Character, Location, Scene } from "../../types/db";

interface EventRow {
  id: string;
  book_id: string;
  title: string;
  description: string;
  date_value: string;
  chapter_id: string | null;
  sort_order: number;
  status: string;
  position_x: number;
  position_y: number;
  position_set: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventRow): Event {
  return EventSchema.parse({
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    description: row.description,
    dateValue: row.date_value,
    chapterId: row.chapter_id,
    sortOrder: row.sort_order,
    status: row.status,
    positionX: row.position_x,
    positionY: row.position_y,
    positionSet: row.position_set === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createEvent(
  bookId: string,
  title: string,
): Promise<Event> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const existing = await db.select<{ maxOrder: number | null }[]>(
    "SELECT MAX(sort_order) as maxOrder FROM events WHERE book_id = $1",
    [bookId],
  );
  const nextOrder = (existing[0]?.maxOrder ?? -1) + 1;

  await db.execute(
    `INSERT INTO events (id, book_id, title, description, date_value, chapter_id, sort_order, status, created_at, updated_at)
     VALUES ($1, $2, $3, '', '', NULL, $4, 'draft', $5, $5)`,
    [id, bookId, title, nextOrder, now],
  );

  return {
    id,
    bookId,
    title,
    description: "",
    dateValue: "",
    chapterId: null,
    sortOrder: nextOrder,
    status: "draft",
    positionX: 0,
    positionY: 0,
    positionSet: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listEventsByBook(bookId: string): Promise<Event[]> {
  const db = await getDb();
  const rows = await db.select<EventRow[]>(
    "SELECT * FROM events WHERE book_id = $1 ORDER BY sort_order ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface EventUpdateFields {
  title: string;
  description: string;
  dateValue: string;
  chapterId: string | null;
  status: string;
}

export async function updateEvent(
  id: string,
  fields: EventUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE events SET title = $1, description = $2, date_value = $3, chapter_id = $4, status = $5, updated_at = $6 WHERE id = $7`,
    [
      fields.title,
      fields.description,
      fields.dateValue,
      fields.chapterId,
      fields.status,
      now,
      id,
    ],
  );
}

export async function updateEventPosition(
  id: string,
  x: number,
  y: number,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE events SET position_x = $1, position_y = $2, position_set = 1 WHERE id = $3",
    [x, y, id],
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM events WHERE id = $1", [id]);
}

// --- Event <-> Scene links ---

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

function mapSceneRow(row: SceneRow): Scene {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    sortOrder: row.sort_order,
    content: row.content,
    synopsis: row.synopsis,
    povCharacterId: row.pov_character_id,
    locationId: row.location_id,
    status: row.status as Scene["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function linkEventToScene(
  eventId: string,
  sceneId: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT OR IGNORE INTO event_scenes (event_id, scene_id, created_at) VALUES ($1, $2, $3)",
    [eventId, sceneId, now],
  );
}

export async function unlinkEventFromScene(
  eventId: string,
  sceneId: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM event_scenes WHERE event_id = $1 AND scene_id = $2",
    [eventId, sceneId],
  );
}

export async function listScenesForEvent(eventId: string): Promise<Scene[]> {
  const db = await getDb();
  const rows = await db.select<SceneRow[]>(
    `SELECT s.* FROM scenes s
     JOIN event_scenes es ON es.scene_id = s.id
     WHERE es.event_id = $1
     ORDER BY s.sort_order ASC`,
    [eventId],
  );
  return rows.map(mapSceneRow);
}

// --- Event <-> Character links ---

interface CharacterRow {
  id: string;
  book_id: string;
  name: string;
  description: string;
  age: number | null;
  occupation: string;
  goals: string;
  fears: string;
  secrets: string;
  notes: string;
  aliases: string;
  role: string;
  appearance: string;
  personality: string;
  backstory: string;
  arc_beginning: string;
  arc_middle: string;
  arc_end: string;
  created_at: string;
  updated_at: string;
}

function mapCharacterRow(row: CharacterRow): Character {
  return {
    id: row.id,
    bookId: row.book_id,
    name: row.name,
    description: row.description,
    age: row.age,
    occupation: row.occupation,
    goals: row.goals,
    fears: row.fears,
    secrets: row.secrets,
    notes: row.notes,
    aliases: row.aliases,
    role: row.role,
    appearance: row.appearance,
    personality: row.personality,
    backstory: row.backstory,
    arcBeginning: row.arc_beginning,
    arcMiddle: row.arc_middle,
    arcEnd: row.arc_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function linkEventToCharacter(
  eventId: string,
  characterId: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT OR IGNORE INTO event_characters (event_id, character_id, created_at) VALUES ($1, $2, $3)",
    [eventId, characterId, now],
  );
}

export async function unlinkEventFromCharacter(
  eventId: string,
  characterId: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM event_characters WHERE event_id = $1 AND character_id = $2",
    [eventId, characterId],
  );
}

export async function listCharactersForEvent(
  eventId: string,
): Promise<Character[]> {
  const db = await getDb();
  const rows = await db.select<CharacterRow[]>(
    `SELECT c.* FROM characters c
     JOIN event_characters ec ON ec.character_id = c.id
     WHERE ec.event_id = $1
     ORDER BY c.name ASC`,
    [eventId],
  );
  return rows.map(mapCharacterRow);
}

export async function listEventsForCharacter(
  characterId: string,
): Promise<Event[]> {
  const db = await getDb();
  const rows = await db.select<EventRow[]>(
    `SELECT e.* FROM events e
     JOIN event_characters ec ON ec.event_id = e.id
     WHERE ec.character_id = $1
     ORDER BY e.sort_order ASC`,
    [characterId],
  );
  return rows.map(mapRow);
}

// --- Event <-> Location links ---

interface LocationRow {
  id: string;
  book_id: string;
  name: string;
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapLocationRow(row: LocationRow): Location {
  return {
    id: row.id,
    bookId: row.book_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function linkEventToLocation(
  eventId: string,
  locationId: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT OR IGNORE INTO event_locations (event_id, location_id, created_at) VALUES ($1, $2, $3)",
    [eventId, locationId, now],
  );
}

export async function unlinkEventFromLocation(
  eventId: string,
  locationId: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM event_locations WHERE event_id = $1 AND location_id = $2",
    [eventId, locationId],
  );
}

export async function listLocationsForEvent(
  eventId: string,
): Promise<Location[]> {
  const db = await getDb();
  const rows = await db.select<LocationRow[]>(
    `SELECT l.* FROM locations l
     JOIN event_locations el ON el.location_id = l.id
     WHERE el.event_id = $1
     ORDER BY l.name ASC`,
    [eventId],
  );
  return rows.map(mapLocationRow);
}