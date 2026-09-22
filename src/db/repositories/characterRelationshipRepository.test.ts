import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../test/dbTestUtils";

const dbHolder = vi.hoisted(() => ({ current: null as TestDb | null }));

vi.mock("../client", () => ({
  getDb: async () => dbHolder.current,
}));

import { createProject } from "./projectRepository";
import { createBook } from "./bookRepository";
import { createCharacter } from "./characterRepository";
import {
  createCharacterRelationship,
  listRelationshipsForCharacter,
  updateCharacterRelationship,
  deleteCharacterRelationship,
} from "./characterRelationshipRepository";

beforeEach(() => {
  dbHolder.current = createTestDb();
});

async function seedTwoCharacters() {
  const project = await createProject("Test Project");
  const book = await createBook(project.id, "Test Book");
  const a = await createCharacter(book.id, "Alice");
  const b = await createCharacter(book.id, "Bob");
  return { book, a, b };
}

describe("characterRelationshipRepository", () => {
  it("creates a relationship and finds it from both sides", async () => {
    const { book, a, b } = await seedTwoCharacters();

    await createCharacterRelationship(book.id, a.id, b.id, "friend");

    const fromA = await listRelationshipsForCharacter(a.id);
    const fromB = await listRelationshipsForCharacter(b.id);

    expect(fromA).toHaveLength(1);
    expect(fromB).toHaveLength(1);
    expect(fromA[0].type).toBe("friend");
    expect(fromA[0].fromCharacterId).toBe(a.id);
    expect(fromA[0].toCharacterId).toBe(b.id);
  });

  it("updates a relationship's fields", async () => {
    const { a, b, book } = await seedTwoCharacters();
    const rel = await createCharacterRelationship(book.id, a.id, b.id, "friend");

    await updateCharacterRelationship(rel.id, {
      type: "rival",
      description: "They had a falling out.",
      strength: 3,
    });

    const [updated] = await listRelationshipsForCharacter(a.id);
    expect(updated.type).toBe("rival");
    expect(updated.description).toBe("They had a falling out.");
    expect(updated.strength).toBe(3);
  });

  it("deletes a relationship", async () => {
    const { a, b, book } = await seedTwoCharacters();
    const rel = await createCharacterRelationship(book.id, a.id, b.id, "friend");

    await deleteCharacterRelationship(rel.id);

    expect(await listRelationshipsForCharacter(a.id)).toHaveLength(0);
  });
});