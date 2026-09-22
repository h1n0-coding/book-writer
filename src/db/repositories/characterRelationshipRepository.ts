import { getDb } from "../client";
import {
  CharacterRelationship,
  CharacterRelationshipSchema,
} from "../../types/db";

interface CharacterRelationshipRow {
  id: string;
  book_id: string;
  from_character_id: string;
  to_character_id: string;
  type: string;
  description: string;
  strength: number | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: CharacterRelationshipRow): CharacterRelationship {
  return CharacterRelationshipSchema.parse({
    id: row.id,
    bookId: row.book_id,
    fromCharacterId: row.from_character_id,
    toCharacterId: row.to_character_id,
    type: row.type,
    description: row.description,
    strength: row.strength,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createCharacterRelationship(
  bookId: string,
  fromCharacterId: string,
  toCharacterId: string,
  type: string,
): Promise<CharacterRelationship> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO character_relationships (id, book_id, from_character_id, to_character_id, type, description, strength, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, '', NULL, $6, $6)`,
    [id, bookId, fromCharacterId, toCharacterId, type, now],
  );

  return {
    id,
    bookId,
    fromCharacterId,
    toCharacterId,
    type,
    description: "",
    strength: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listRelationshipsForCharacter(
  characterId: string,
): Promise<CharacterRelationship[]> {
  const db = await getDb();
  const rows = await db.select<CharacterRelationshipRow[]>(
    `SELECT * FROM character_relationships
     WHERE from_character_id = $1 OR to_character_id = $1
     ORDER BY created_at ASC`,
    [characterId],
  );
  return rows.map(mapRow);
}

export async function listRelationshipsByBook(
  bookId: string,
): Promise<CharacterRelationship[]> {
  const db = await getDb();
  const rows = await db.select<CharacterRelationshipRow[]>(
    "SELECT * FROM character_relationships WHERE book_id = $1 ORDER BY created_at ASC",
    [bookId],
  );
  return rows.map(mapRow);
}

export interface CharacterRelationshipUpdateFields {
  type: string;
  description: string;
  strength: number | null;
}

export async function updateCharacterRelationship(
  id: string,
  fields: CharacterRelationshipUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    `UPDATE character_relationships SET type = $1, description = $2, strength = $3, updated_at = $4 WHERE id = $5`,
    [fields.type, fields.description, fields.strength, now, id],
  );
}

export async function deleteCharacterRelationship(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM character_relationships WHERE id = $1", [id]);
}