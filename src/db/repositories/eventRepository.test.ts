import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../test/dbTestUtils";

const dbHolder = vi.hoisted(() => ({ current: null as TestDb | null }));

vi.mock("../client", () => ({
  getDb: async () => dbHolder.current,
}));

import { createProject } from "./projectRepository";
import { createBook } from "./bookRepository";
import {
  createEvent,
  listEventsByBook,
  updateEvent,
  updateEventPosition,
} from "./eventRepository";

beforeEach(() => {
  dbHolder.current = createTestDb();
});

async function seedBook() {
  const project = await createProject("Test Project");
  return createBook(project.id, "Test Book");
}

describe("eventRepository", () => {
  it("creates an event with sensible defaults", async () => {
    const book = await seedBook();
    const event = await createEvent(book.id, "Letter is found");

    expect(event.title).toBe("Letter is found");
    expect(event.status).toBe("draft");
    expect(event.positionSet).toBe(false);
  });

  it("updates an event's editable fields", async () => {
    const book = await seedBook();
    const event = await createEvent(book.id, "Letter is found");

    await updateEvent(event.id, {
      title: "The letter is found",
      description: "Sarah finds the hidden letter.",
      dateValue: "Day 3",
      chapterId: null,
      status: "done",
    });

    const [updated] = await listEventsByBook(book.id);
    expect(updated.title).toBe("The letter is found");
    expect(updated.status).toBe("done");
    expect(updated.dateValue).toBe("Day 3");
  });

  it("persists node position for the mindmap", async () => {
    const book = await seedBook();
    const event = await createEvent(book.id, "Letter is found");

    await updateEventPosition(event.id, 240, 150);

    const [reloaded] = await listEventsByBook(book.id);
    expect(reloaded.positionX).toBe(240);
    expect(reloaded.positionY).toBe(150);
    expect(reloaded.positionSet).toBe(true);
  });
});