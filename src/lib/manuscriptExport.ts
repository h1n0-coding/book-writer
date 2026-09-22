import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { listChaptersByBook } from "../db/repositories/chapterRepository";
import { listScenesByChapter } from "../db/repositories/sceneRepository";
import type { Chapter, Scene } from "../types/db";

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|h1|h2|h3|blockquote|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildManuscriptText(
  bookTitle: string,
  chapters: Chapter[],
  scenesByChapter: Record<string, Scene[]>,
): string {
  let out = `${bookTitle.toUpperCase()}\n${"=".repeat(bookTitle.length)}\n\n`;

  for (const chapter of chapters) {
    out += `${chapter.title}\n${"-".repeat(chapter.title.length)}\n\n`;
    const scenes = scenesByChapter[chapter.id] ?? [];
    for (const scene of scenes) {
      const text = htmlToPlainText(scene.content);
      if (text) out += text + "\n\n";
    }
  }

  return out.trim() + "\n";
}

export async function exportManuscriptToFile(
  bookId: string,
  bookTitle: string,
): Promise<string | null> {
  const chapters = await listChaptersByBook(bookId);
  const scenesByChapter: Record<string, Scene[]> = {};
  for (const chapter of chapters) {
    scenesByChapter[chapter.id] = await listScenesByChapter(chapter.id);
  }

  const text = buildManuscriptText(bookTitle, chapters, scenesByChapter);

  const path = await save({
    defaultPath: `${bookTitle}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (!path) return null;

  await writeTextFile(path, text);
  return path;
}