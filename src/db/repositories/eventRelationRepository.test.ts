import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../test/dbTestUtils";

const dbHolder = vi.hoisted(() => ({ current: null as TestDb | null }));

vi.mock("../client", () => ({
  getDb: async () => dbHolder.current,
}));

import { createProject } from "./projectRepository";
import { createBook } from "./bookRepository";
import { createEvent } from "./eventRepository";
import {
  createEventRelation,
  listRelationsForEvent,
  listRelationsByBook,
} from "./eventRelationRepository";

beforeEach(() => {
  dbHolder.current = createTestDb();
});

describe("eventRelationRepository", () => {
  it("connects two events and loads the edge from both sides", async () => {
    const project = await createProject("Test Project");
    const book = await createBook(project.id, "Test Book");
    const eventA = await createEvent(book.id, "Brother disappears");
    const eventB = await createEvent(book.id, "John investigates");

    await createEventRelation(book.id, eventA.id, eventB.id, "causes");

    const fromA = await listRelationsForEvent(eventA.id);
    const fromB = await listRelationsForEvent(eventB.id);
    const all = await listRelationsByBook(book.id);

    expect(fromA).toHaveLength(1);
    expect(fromB).toHaveLength(1);
    expect(all).toHaveLength(1);
    expect(fromA[0].type).toBe("causes");
  });
});