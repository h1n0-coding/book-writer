import { getDb } from "../client";
import { Character, CharacterSchema } from "../../types/db";
import type { Chapter, Location } from "../../types/db";

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

function mapRow(row: CharacterRow): Character {
  return CharacterSchema.parse({
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
  });
}

export async function createCharacter(
  bookId: string,
  name: string,
): Promise<Character> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO characters (id, book_id, name, description, age, occupation, goals, fears, secrets, notes, aliases, role, appearance, personality, backstory, arc_beginning, arc_middle, arc_end, created_at, updated_at)
     VALUES ($1, $2, $3, '', NULL, '', '', '', '', '', '', '', '', '', '', '', '', '', $4, $4)`,
    [id, bookId, name, now],
  );

  return {
    id,
    bookId,
    name,
    description: "",
    age: null,
    occupation: "",
    goals: "",
    fears: "",
    secrets: "",
    notes: "",
    aliases: "",
    role: "",
    appearance: "",
    personality: "",
    backstory: "",
    arcBeginning: "",
    arcMiddle: "",
    arcEnd: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listCharactersByBook(bookId: string): Promise<Character[]> {
  const db = await getDb();
  const rows = await db.select<CharacterRow[]>(
    "SELECT * FROM characters WHERE book_id = $1 ORDER BY name ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface CharacterUpdateFields {
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
  arcBeginning: string;
  arcMiddle: string;
  arcEnd: string;
}

export async function updateCharacter(
  id: string,
  fields: CharacterUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE characters SET
       name = $1, description = $2, age = $3, occupation = $4, goals = $5,
       fears = $6, secrets = $7, notes = $8, aliases = $9, role = $10,
       appearance = $11, personality = $12, backstory = $13,
       arc_beginning = $14, arc_middle = $15, arc_end = $16, updated_at = $17
     WHERE id = $18`,
    [
      fields.name,
      fields.description,
      fields.age,
      fields.occupation,
      fields.goals,
      fields.fears,
      fields.secrets,
      fields.notes,
      fields.aliases,
      fields.role,
      fields.appearance,
      fields.personality,
      fields.backstory,
      fields.arcBeginning,
      fields.arcMiddle,
      fields.arcEnd,
      now,
      id,
    ],
  );
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM characters WHERE id = $1", [id]);
}

// --- Computed linked data ---

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

function mapChapterRow(row: ChapterRow): Chapter {
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    sortOrder: row.sort_order,
    synopsis: row.synopsis,
    status: row.status as Chapter["status"],
    targetWordCount: row.target_word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChaptersForCharacter(
  characterId: string,
): Promise<Chapter[]> {
  const db = await getDb();
  const rows = await db.select<ChapterRow[]>(
    `SELECT DISTINCT c.* FROM chapters c
     JOIN scenes s ON s.chapter_id = c.id
     WHERE s.pov_character_id = $1
     ORDER BY c.sort_order ASC`,
    [characterId],
  );
  return rows.map(mapChapterRow);
}

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

export async function listLocationsForCharacter(
  characterId: string,
): Promise<Location[]> {
  const db = await getDb();
  const rows = await db.select<LocationRow[]>(
    `SELECT DISTINCT l.* FROM locations l
     WHERE l.id IN (
       SELECT s.location_id FROM scenes s
       WHERE s.pov_character_id = $1 AND s.location_id IS NOT NULL
       UNION
       SELECT el.location_id FROM event_locations el
       JOIN event_characters ec ON ec.event_id = el.event_id
       WHERE ec.character_id = $1
     )
     ORDER BY l.name ASC`,
    [characterId],
  );
  return rows.map(mapLocationRow);
}

// A character's first POV scene within a given chapter — used for the
// "Story Appearances" click-through in the Wiki page.
export async function getFirstPovSceneInChapter(
  characterId: string,
  chapterId: string,
): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(
    `SELECT id FROM scenes
     WHERE chapter_id = $1 AND pov_character_id = $2
     ORDER BY sort_order ASC
     LIMIT 1`,
    [chapterId, characterId],
  );
  return rows[0]?.id ?? null;
}