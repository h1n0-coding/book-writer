import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../test/dbTestUtils";

const dbHolder = vi.hoisted(() => ({ current: null as TestDb | null }));

vi.mock("../client", () => ({
  getDb: async () => dbHolder.current,
}));

import { createProject } from "./projectRepository";
import { createBook } from "./bookRepository";
import { createChapter } from "./chapterRepository";
import { createScene } from "./sceneRepository";
import { createLocation } from "./locationRepository";
import {
  createCharacter,
  listChaptersForCharacter,
  listLocationsForCharacter,
} from "./characterRepository";
import {
  createEvent,
  linkEventToCharacter,
  linkEventToLocation,
  listEventsForCharacter,
} from "./eventRepository";

beforeEach(() => {
  dbHolder.current = createTestDb();
});

describe("characterRepository — computed linked data", () => {
  it("computes chapters, events, and locations for a character", async () => {
    const project = await createProject("Test Project");
    const book = await createBook(project.id, "Test Book");
    const character = await createCharacter(book.id, "Sarah");
    const chapter = await createChapter(book.id, "Chapter One");
    const scene = await createScene(chapter.id, "Scene One");
    const location = await createLocation(book.id, "Old House");

    // Scene POV/location assignment has no dedicated repository function
    // yet (flagged as a known UI gap) — set it directly for this test.
    await dbHolder.current!.execute(
      "UPDATE scenes SET pov_character_id = $1, location_id = $2 WHERE id = $3",
      [character.id, location.id, scene.id],
    );

    const event = await createEvent(book.id, "Sarah finds the letter");
    await linkEventToCharacter(event.id, character.id);

    const otherLocation = await createLocation(book.id, "Train Station");
    await linkEventToLocation(event.id, otherLocation.id);

    const chapters = await listChaptersForCharacter(character.id);
    const events = await listEventsForCharacter(character.id);
    const locations = await listLocationsForCharacter(character.id);

    expect(chapters).toHaveLength(1);
    expect(chapters[0].id).toBe(chapter.id);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(event.id);

    // Should include both the POV scene's location and the location
    // linked through the event this character participates in.
    const locationNames = locations.map((l) => l.name).sort();
    expect(locationNames).toEqual(["Old House", "Train Station"]);
  });
});