import { getDb } from "../client";
import { Location, LocationSchema } from "../../types/db";
import type { Character, Event, Scene } from "../../types/db";

interface LocationRow {
  id: string;
  book_id: string;
  name: string;
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: LocationRow): Location {
  return LocationSchema.parse({
    id: row.id,
    bookId: row.book_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createLocation(
  bookId: string,
  name: string,
): Promise<Location> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO locations (id, book_id, name, description, notes, created_at, updated_at)
     VALUES ($1, $2, $3, '', '', $4, $4)`,
    [id, bookId, name, now],
  );

  return {
    id,
    bookId,
    name,
    description: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listLocationsByBook(bookId: string): Promise<Location[]> {
  const db = await getDb();
  const rows = await db.select<LocationRow[]>(
    "SELECT * FROM locations WHERE book_id = $1 ORDER BY name ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface LocationUpdateFields {
  name: string;
  description: string;
  notes: string;
}

export async function updateLocation(
  id: string,
  fields: LocationUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE locations SET name = $1, description = $2, notes = $3, updated_at = $4 WHERE id = $5",
    [fields.name, fields.description, fields.notes, now, id],
  );
}

export async function deleteLocation(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM locations WHERE id = $1", [id]);
}

// --- Backlinks: "used in" ---

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

export async function listScenesForLocation(locationId: string): Promise<Scene[]> {
  const db = await getDb();
  const rows = await db.select<SceneRow[]>(
    "SELECT * FROM scenes WHERE location_id = $1 ORDER BY sort_order ASC",
    [locationId],
  );
  return rows.map(mapSceneRow);
}

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

function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    description: row.description,
    dateValue: row.date_value,
    chapterId: row.chapter_id,
    sortOrder: row.sort_order,
    status: row.status as Event["status"],
    positionX: row.position_x,
    positionY: row.position_y,
    positionSet: row.position_set === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEventsForLocation(locationId: string): Promise<Event[]> {
  const db = await getDb();
  const rows = await db.select<EventRow[]>(
    `SELECT e.* FROM events e
     JOIN event_locations el ON el.event_id = e.id
     WHERE el.location_id = $1
     ORDER BY e.sort_order ASC`,
    [locationId],
  );
  return rows.map(mapEventRow);
}

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

export async function listCharactersForLocation(
  locationId: string,
): Promise<Character[]> {
  const db = await getDb();
  const rows = await db.select<CharacterRow[]>(
    `SELECT DISTINCT c.* FROM characters c
     WHERE c.id IN (
       SELECT s.pov_character_id FROM scenes s
       WHERE s.location_id = $1 AND s.pov_character_id IS NOT NULL
       UNION
       SELECT ec.character_id FROM event_characters ec
       JOIN event_locations el ON el.event_id = ec.event_id
       WHERE el.location_id = $1
     )
     ORDER BY c.name ASC`,
    [locationId],
  );
  return rows.map(mapCharacterRow);
}