import { useEffect, useState } from "react";
import {
  createChapter,
  listChaptersByBook,
  renameChapter,
  deleteChapter,
} from "../../db/repositories/chapterRepository";
import {
  createScene,
  listScenesByChapter,
  renameScene,
  deleteScene,
} from "../../db/repositories/sceneRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { Chapter, Scene } from "../../types/db";

export function ManuscriptTree() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const selectedChapterId = useManuscriptStore((s) => s.selectedChapterId);
  const selectedSceneId = useManuscriptStore((s) => s.selectedSceneId);
  const setSelectedChapter = useManuscriptStore((s) => s.setSelectedChapter);
  const setSelectedScene = useManuscriptStore((s) => s.setSelectedScene);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenesByChapter, setScenesByChapter] = useState<Record<string, Scene[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!activeBookId) {
      setChapters([]);
      setScenesByChapter({});
      return;
    }
    setLoading(true);
    try {
      const chapterList = await listChaptersByBook(activeBookId);
      setChapters(chapterList);

      const scenesMap: Record<string, Scene[]> = {};
      for (const chapter of chapterList) {
        scenesMap[chapter.id] = await listScenesByChapter(chapter.id);
      }
      setScenesByChapter(scenesMap);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  async function handleAddChapter() {
    if (!activeBookId) return;
    try {
      await createChapter(activeBookId, t("defaultChapterTitle"));
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleRenameChapter(chapter: Chapter) {
    const title = window.prompt(t("promptRenameChapter"), chapter.title);
    if (!title || title === chapter.title) return;
    try {
      await renameChapter(chapter.id, title);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDeleteChapter(chapter: Chapter) {
    if (!window.confirm(t("confirmDeleteChapterCascade"))) return;
    try {
      await deleteChapter(chapter.id);
      if (selectedChapterId === chapter.id) {
        setSelectedChapter(null);
      }
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleAddScene(chapterId: string) {
    try {
      const scene = await createScene(chapterId, t("defaultSceneTitle"));
      await refresh();
      setSelectedChapter(chapterId);
      setSelectedScene(scene.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleRenameScene(scene: Scene) {
    const title = window.prompt(t("promptRenameScene"), scene.title);
    if (!title || title === scene.title) return;
    try {
      await renameScene(scene.id, title);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDeleteScene(scene: Scene) {
    if (!window.confirm(t("confirmDeleteScene"))) return;
    try {
      await deleteScene(scene.id);
      if (selectedSceneId === scene.id) {
        setSelectedScene(null);
      }
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  if (!activeBookId) {
    return (
      <p className="px-2 text-xs text-zinc-600">{t("selectOrCreateBook")}</p>
    );
  }

  return (
    <div className="text-sm">
      {error && (
        <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">{error}</p>
      )}

      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {t("manuscriptHeading")}
        </span>
        <button
          onClick={handleAddChapter}
          className="text-xs text-zinc-500 hover:text-zinc-200"
          title={t("addChapterTooltip")}
        >
          {t("addChapter")}
        </button>
      </div>

      {loading && chapters.length === 0 && (
        <p className="px-2 text-xs text-zinc-600">{t("loading")}</p>
      )}

      {!loading && chapters.length === 0 && (
        <p className="px-2 text-xs text-zinc-600">{t("noChaptersYet")}</p>
      )}

      <ul className="flex flex-col gap-1">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <div className="flex items-center gap-1 px-2 py-0.5">
              <button
                onClick={() => setSelectedChapter(chapter.id)}
                className="flex-1 truncate text-left text-zinc-300 hover:text-zinc-100"
              >
                {chapter.title}
              </button>
              <button
                onClick={() => handleAddScene(chapter.id)}
                className="text-xs text-zinc-600 hover:text-zinc-300"
                title={t("addSceneTooltip")}
              >
                +
              </button>
              <button
                onClick={() => handleRenameChapter(chapter)}
                className="text-xs text-zinc-600 hover:text-zinc-300"
                title={t("renameTooltip")}
              >
                ✎
              </button>
              <button
                onClick={() => handleDeleteChapter(chapter)}
                className="text-xs text-zinc-600 hover:text-red-400"
                title={t("deleteLabel")}
              >
                ×
              </button>
            </div>
            <ul className="ml-4 flex flex-col gap-0.5 border-l border-zinc-800 pl-2">
              {(scenesByChapter[chapter.id] ?? []).map((scene) => (
                <li key={scene.id}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedScene(scene.id)}
                      className={`flex-1 truncate rounded px-1 py-0.5 text-left text-xs ${
                        selectedSceneId === scene.id
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {scene.title}
                    </button>
                    <button
                      onClick={() => handleRenameScene(scene)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300"
                      title={t("renameTooltip")}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene)}
                      className="text-[10px] text-zinc-600 hover:text-red-400"
                      title={t("deleteLabel")}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}