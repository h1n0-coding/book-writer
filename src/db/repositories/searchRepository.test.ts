import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../test/dbTestUtils";

const dbHolder = vi.hoisted(() => ({ current: null as TestDb | null }));

vi.mock("../client", () => ({
  getDb: async () => dbHolder.current,
}));

import { createProject } from "./projectRepository";
import { createBook } from "./bookRepository";
import { createCharacter } from "./characterRepository";
import { searchBook } from "./searchRepository";

beforeEach(() => {
  dbHolder.current = createTestDb();
});

describe("searchRepository — Cyrillic case-insensitive search", () => {
  it("finds a Cyrillic name regardless of query case", async () => {
    const project = await createProject("Тестовый проект");
    const book = await createBook(project.id, "Тестовая книга");
    await createCharacter(book.id, "Иван");

    const lowercase = await searchBook(book.id, "иван");
    const uppercase = await searchBook(book.id, "ИВАН");

    expect(lowercase).toHaveLength(1);
    expect(lowercase[0].title).toBe("Иван");
    expect(uppercase).toHaveLength(1);
  });

  it("returns nothing for queries shorter than 2 characters", async () => {
    const project = await createProject("Test Project");
    const book = await createBook(project.id, "Test Book");
    await createCharacter(book.id, "Иван");

    expect(await searchBook(book.id, "и")).toHaveLength(0);
  });
});