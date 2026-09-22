import { useEffect, useState } from "react";
import {
  searchBook,
  type SearchResult,
  type SearchResultType,
} from "../../db/repositories/searchRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";

export function SearchPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const setActiveView = useManuscriptStore((s) => s.setActiveView);
  const setSelectedChapter = useManuscriptStore((s) => s.setSelectedChapter);
  const setSelectedScene = useManuscriptStore((s) => s.setSelectedScene);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<SearchResultType, string> = {
    scene: t("typeLabelScene"),
    chapter: t("typeLabelChapter"),
    character: t("typeLabelCharacter"),
    location: t("typeLabelLocation"),
    note: t("typeLabelNote"),
  };

  useEffect(() => {
    if (!activeBookId || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const r = await searchBook(activeBookId, query);
        setResults(r);
      } catch (err) {
        setError(String(err));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeBookId, query]);

  function handleClick(result: SearchResult) {
    switch (result.type) {
      case "scene":
        if (result.chapterId) setSelectedChapter(result.chapterId);
        setSelectedScene(result.id);
        break;
      case "chapter":
        setActiveView("roadmap");
        break;
      case "character":
        setActiveView("characters");
        break;
      case "location":
        setActiveView("locations");
        break;
      case "note":
        setActiveView("notes");
        break;
    }
  }

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="mb-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
      />
      {error && (
        <p className="mb-3 rounded bg-red-950 p-2 text-xs text-red-400">
          {error}
        </p>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-zinc-600">{t("noResults")}</p>
      )}
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`}>
            <button
              onClick={() => handleClick(r)}
              className="w-full rounded border border-zinc-800 p-2 text-left hover:bg-zinc-900"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {typeLabels[r.type]}
                </span>
                <span className="truncate text-sm text-zinc-200">{r.title}</span>
              </div>
              {r.snippet && (
                <p className="truncate text-xs text-zinc-500">{r.snippet}</p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}