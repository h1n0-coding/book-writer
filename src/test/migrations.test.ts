import { describe, expect, it } from "vitest";
import { createTestDb } from "./dbTestUtils";

interface CharacterCheckRow {
  name: string;
  description: string;
  aliases: string;
  arc_beginning: string;
}

describe("migrations", () => {
  it("applies all migrations to a fresh database without error", () => {
    expect(() => createTestDb()).not.toThrow();
  });

  it("lets a pre-Wiki-2.0 character INSERT still work, with sensible new-column defaults", async () => {
    const db = createTestDb(); // full migration history, 0001-0010
    const now = new Date().toISOString();

    await db.execute(
      "INSERT INTO projects (id, name, created_at, updated_at) VALUES ($1, $2, $3, $3)",
      ["p1", "Old Project", now],
    );
    await db.execute(
      "INSERT INTO books (id, project_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)",
      ["b1", "p1", "Old Book", now],
    );

    // This uses exactly the column list from the ORIGINAL (pre-Wiki-2.0)
    // characterRepository.createCharacter — it must still succeed after
    // migration 0010 added aliases/role/appearance/etc. with defaults.
    await db.execute(
      `INSERT INTO characters (id, book_id, name, description, age, occupation, goals, fears, secrets, notes, created_at, updated_at)
       VALUES ($1, $2, $3, 'A mysterious figure', 40, 'Detective', '', '', '', '', $4, $4)`,
      ["c1", "b1", "Old Character", now],
    );

    const rows = await db.select<CharacterCheckRow[]>(
      "SELECT name, description, aliases, arc_beginning FROM characters WHERE id = $1",
      ["c1"],
    );
    const row = rows[0];

    expect(row.name).toBe("Old Character");
    expect(row.description).toBe("A mysterious figure");
    expect(row.aliases).toBe("");
    expect(row.arc_beginning).toBe("");
  });
});