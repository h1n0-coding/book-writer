import { useEffect, useRef, useState } from "react";
import {
  listChaptersByBook,
  updateChapter,
  moveChapter,
  type ChapterUpdateFields,
} from "../../db/repositories/chapterRepository";
import { listScenesByChapter } from "../../db/repositories/sceneRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import { countWordsFromHtml } from "../../lib/text";
import type { Chapter, ChapterStatus } from "../../types/db";

const STATUS_OPTIONS: ChapterStatus[] = ["draft", "in_progress", "done"];

export function RoadmapPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!activeBookId) {
      setChapters([]);
      setWordCounts({});
      return;
    }
    try {
      const list = await listChaptersByBook(activeBookId);
      setChapters(list);

      const counts: Record<string, number> = {};
      for (const chapter of list) {
        const scenes = await listScenesByChapter(chapter.id);
        counts[chapter.id] = scenes.reduce(
          (sum, scene) => sum + countWordsFromHtml(scene.content),
          0,
        );
      }
      setWordCounts(counts);
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  async function handleMove(chapterId: string, direction: "up" | "down") {
    if (!activeBookId) return;
    try {
      await moveChapter(activeBookId, chapterId, direction);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <h2 className="mb-3 text-zinc-200">{t("navRoadmap")}</h2>
      {error && (
        <p className="mb-3 rounded bg-red-950 p-2 text-xs text-red-400">
          {error}
        </p>
      )}
      {chapters.length === 0 && (
        <p className="text-sm text-zinc-600">{t("noChaptersSimple")}</p>
      )}
      <div className="flex flex-col gap-3">
        {chapters.map((chapter, index) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            wordCount={wordCounts[chapter.id] ?? 0}
            canMoveUp={index > 0}
            canMoveDown={index < chapters.length - 1}
            onMove={(dir) => handleMove(chapter.id, dir)}
            onSaved={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function ChapterRow({
  chapter,
  wordCount,
  canMoveUp,
  canMoveDown,
  onMove,
  onSaved,
}: {
  chapter: Chapter;
  wordCount: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: "up" | "down") => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<ChapterUpdateFields>({
    title: chapter.title,
    synopsis: chapter.synopsis,
    status: chapter.status,
    targetWordCount: chapter.targetWordCount,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof ChapterUpdateFields>(
    key: K,
    value: ChapterUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateChapter(chapter.id, next);
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  const progressPct =
    fields.targetWordCount > 0
      ? Math.min(100, Math.round((wordCount / fields.targetWordCount) * 100))
      : null;

  const statusLabel: Record<string, string> = {
    idle: t("statusUnsaved"),
    saving: t("statusSaving"),
    saved: t("statusSaved"),
    error: t("statusError"),
  };

  const statusOptionLabel: Record<ChapterStatus, string> = {
    draft: t("statusDraft"),
    in_progress: t("statusInProgress"),
    done: t("statusDone"),
  };

  return (
    <div className="rounded border border-zinc-800 p-3">
      <div className="mb-2 flex items-start gap-2">
        <div className="flex flex-col">
          <button
            disabled={!canMoveUp}
            onClick={() => onMove("up")}
            className="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
          >
            ▲
          </button>
          <button
            disabled={!canMoveDown}
            onClick={() => onMove("down")}
            className="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
          >
            ▼
          </button>
        </div>

        <input
          value={fields.title}
          onChange={(e) => update("title", e.target.value)}
          className="flex-1 rounded bg-transparent text-base text-zinc-100 outline-none"
        />

        <select
          value={fields.status}
          onChange={(e) => update("status", e.target.value as ChapterStatus)}
          className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusOptionLabel[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500">
        <span>
          {wordCount} {t("wordsLabel")}
        </span>
        <span>/</span>
        <label className="flex items-center gap-1">
          {t("targetLabel")}
          <input
            type="number"
            min={0}
            value={fields.targetWordCount}
            onChange={(e) => update("targetWordCount", Number(e.target.value))}
            className="w-20 rounded bg-zinc-900 px-1 py-0.5 text-zinc-200 outline-none"
          />
        </label>
        {progressPct !== null && <span>({progressPct}%)</span>}
        <span
          className={
            status === "error" ? "ml-auto text-red-400" : "ml-auto text-zinc-600"
          }
        >
          {statusLabel[status]}
        </span>
      </div>

      <textarea
        value={fields.synopsis}
        onChange={(e) => update("synopsis", e.target.value)}
        rows={2}
        placeholder={t("synopsisPlaceholder")}
        className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
      />
    </div>
  );
}