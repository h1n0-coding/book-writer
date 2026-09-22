import { getDb } from "../client";
import { CharacterField, CharacterFieldSchema } from "../../types/db";

interface CharacterFieldRow {
  id: string;
  character_id: string;
  name: string;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: CharacterFieldRow): CharacterField {
  return CharacterFieldSchema.parse({
    id: row.id,
    characterId: row.character_id,
    name: row.name,
    value: row.value,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createCharacterField(
  characterId: string,
  name: string,
): Promise<CharacterField> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const existing = await db.select<{ maxOrder: number | null }[]>(
    "SELECT MAX(sort_order) as maxOrder FROM character_fields WHERE character_id = $1",
    [characterId],
  );
  const nextOrder = (existing[0]?.maxOrder ?? -1) + 1;

  await db.execute(
    "INSERT INTO character_fields (id, character_id, name, value, sort_order, created_at, updated_at) VALUES ($1, $2, $3, '', $4, $5, $5)",
    [id, characterId, name, nextOrder, now],
  );

  return {
    id,
    characterId,
    name,
    value: "",
    sortOrder: nextOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listFieldsByCharacter(
  characterId: string,
): Promise<CharacterField[]> {
  const db = await getDb();
  const rows = await db.select<CharacterFieldRow[]>(
    "SELECT * FROM character_fields WHERE character_id = $1 ORDER BY sort_order ASC",
    [characterId],
  );
  return rows.map(mapRow);
}

export interface CharacterFieldUpdateFields {
  name: string;
  value: string;
}

export async function updateCharacterField(
  id: string,
  fields: CharacterFieldUpdateFields,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE character_fields SET name = $1, value = $2, updated_at = $3 WHERE id = $4",
    [fields.name, fields.value, now, id],
  );
}

export async function deleteCharacterField(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM character_fields WHERE id = $1", [id]);
}