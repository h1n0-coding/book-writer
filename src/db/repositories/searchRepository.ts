import { listChaptersByBook } from "./chapterRepository";
import { listScenesByBook } from "./sceneRepository";
import { listCharactersByBook } from "./characterRepository";
import { listLocationsByBook } from "./locationRepository";
import { listNotesByBook } from "./noteRepository";

export type SearchResultType =
  | "scene"
  | "chapter"
  | "character"
  | "location"
  | "note";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string;
  chapterId?: string;
}

function snippet(text: string, maxLen = 120): string {
  const clean = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + "…" : clean;
}

// Cyrillic-safe case-insensitive matching: SQLite's own LOWER()/LIKE only
// fold ASCII case, so filtering is done here in JS instead, where
// toLowerCase() correctly handles Cyrillic (and any other Unicode script).
function matches(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(q));
}

export async function searchBook(
  bookId: string,
  query: string,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [chapters, scenes, characters, locations, notes] = await Promise.all([
    listChaptersByBook(bookId),
    listScenesByBook(bookId),
    listCharactersByBook(bookId),
    listLocationsByBook(bookId),
    listNotesByBook(bookId),
  ]);

  const results: SearchResult[] = [];

  for (const c of chapters) {
    if (matches(trimmed, c.title, c.synopsis)) {
      results.push({
        type: "chapter",
        id: c.id,
        title: c.title,
        snippet: snippet(c.synopsis),
      });
    }
  }

  for (const s of scenes) {
    if (matches(trimmed, s.title, s.content, s.synopsis)) {
      results.push({
        type: "scene",
        id: s.id,
        chapterId: s.chapterId,
        title: s.title,
        snippet: snippet(s.content || s.synopsis),
      });
    }
  }

  for (const c of characters) {
    if (
      matches(
        trimmed,
        c.name,
        c.description,
        c.notes,
        c.occupation,
        c.goals,
        c.fears,
        c.secrets,
      )
    ) {
      results.push({
        type: "character",
        id: c.id,
        title: c.name,
        snippet: snippet(c.description || c.notes),
      });
    }
  }

  for (const l of locations) {
    if (matches(trimmed, l.name, l.description, l.notes)) {
      results.push({
        type: "location",
        id: l.id,
        title: l.name,
        snippet: snippet(l.description || l.notes),
      });
    }
  }

  for (const n of notes) {
    if (matches(trimmed, n.title, n.content)) {
      results.push({
        type: "note",
        id: n.id,
        title: n.title,
        snippet: snippet(n.content),
      });
    }
  }

  return results;
}