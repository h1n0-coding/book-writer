import { describe, it, expect } from "vitest";
import { buildManuscriptText, htmlToPlainText } from "./manuscriptExport";
import type { Chapter, Scene } from "../types/db";

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: "ch1",
    bookId: "book1",
    title: "Chapter One",
    sortOrder: 0,
    synopsis: "",
    status: "draft",
    targetWordCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: "sc1",
    chapterId: "ch1",
    title: "Scene One",
    sortOrder: 0,
    content: "",
    synopsis: "",
    povCharacterId: null,
    locationId: null,
    status: "draft",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("htmlToPlainText", () => {
  it("converts paragraph breaks to blank lines", () => {
    const result = htmlToPlainText("<p>First</p><p>Second</p>");
    expect(result).toBe("First\n\nSecond");
  });

  it("decodes common HTML entities", () => {
    expect(htmlToPlainText("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
  });
});

describe("buildManuscriptText", () => {
  it("includes the book title, chapter titles, and scene text", () => {
    const chapter = makeChapter();
    const scene = makeScene({ content: "<p>It was a dark night.</p>" });

    const text = buildManuscriptText("My Novel", [chapter], {
      [chapter.id]: [scene],
    });

    expect(text).toContain("MY NOVEL");
    expect(text).toContain("Chapter One");
    expect(text).toContain("It was a dark night.");
  });

  it("skips chapters with no scenes without throwing", () => {
    const chapter = makeChapter({ title: "Empty Chapter" });
    const text = buildManuscriptText("My Novel", [chapter], {});
    expect(text).toContain("Empty Chapter");
  });
});