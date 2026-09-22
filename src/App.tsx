import { useEffect } from "react";
import { ProjectBookPicker } from "./features/manuscript/ProjectBookPicker";
import { ManuscriptTree } from "./features/manuscript/ManuscriptTree";
import { SceneEditor } from "./features/manuscript/SceneEditor";
import { CharactersPanel } from "./features/characters/CharactersPanel";
import { LocationsPanel } from "./features/locations/LocationsPanel";
import { TimelinePanel } from "./features/timeline/TimelinePanel";
import { MindmapPanel } from "./features/mindmap/MindmapPanel";
import { RoadmapPanel } from "./features/roadmap/RoadmapPanel";
import { NotesPanel } from "./features/notes/NotesPanel";
import { SearchPanel } from "./features/search/SearchPanel";
import { ExportControls } from "./features/export/ExportControls";
import { useManuscriptStore, type ManuscriptView } from "./stores/manuscriptStore";
import { useLocaleStore } from "./stores/localeStore";
import { useTranslation } from "./i18n/useTranslation";
import type { Locale } from "./i18n/translations";

function SidebarItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-left ${
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const options: Locale[] = ["ru", "en"];

  return (
    <div className="flex items-center gap-1 text-xs">
      {options.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded px-1.5 py-0.5 uppercase ${
            locale === l
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  const activeView = useManuscriptStore((s) => s.activeView);
  const setActiveView = useManuscriptStore((s) => s.setActiveView);
  const activeProjectId = useManuscriptStore((s) => s.activeProjectId);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveView("search");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setActiveView]);

  const navItems: { label: string; view: ManuscriptView }[] = [
    { label: t("navRoadmap"), view: "roadmap" },
    { label: t("navCharacters"), view: "characters" },
    { label: t("navLocations"), view: "locations" },
    { label: t("navTimeline"), view: "timeline" },
    { label: t("navMindmap"), view: "mindmap" },
    { label: t("navRelationships"), view: "relationships" },
    { label: t("navNotes"), view: "notes" },
    { label: t("navSearch"), view: "search" },
  ];

  const knownViews: ManuscriptView[] = [
    "manuscript",
    "characters",
    "locations",
    "timeline",
    "mindmap",
    "roadmap",
    "notes",
    "search",
  ];

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 px-3 text-sm text-zinc-400">
        <span>{t("appTitle")}</span>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-zinc-600 sm:inline">
            {t("shortcuts")}
          </span>
          <ExportControls />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900 p-2">
          <ProjectBookPicker />
          <ManuscriptTree />

          <div className="mt-4 flex flex-col gap-0.5 border-t border-zinc-800 pt-3 text-sm">
            {navItems.map((item) => (
              <SidebarItem
                key={item.view}
                label={item.label}
                active={activeView === item.view}
                onClick={() => setActiveView(item.view)}
              />
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden p-6">
          {!activeProjectId ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="mb-2 text-zinc-300">{t("welcomeTitle")}</p>
                <p className="text-sm text-zinc-500">{t("welcomeBody")}</p>
              </div>
            </div>
          ) : (
            <>
              {activeView === "manuscript" && <SceneEditor />}
              {activeView === "characters" && <CharactersPanel />}
              {activeView === "locations" && <LocationsPanel />}
              {activeView === "timeline" && <TimelinePanel />}
              {activeView === "mindmap" && <MindmapPanel />}
              {activeView === "roadmap" && <RoadmapPanel />}
              {activeView === "notes" && <NotesPanel />}
              {activeView === "search" && <SearchPanel />}
              {!knownViews.includes(activeView) && (
                <p className="text-zinc-500">{t("comingSoon")}</p>
              )}
            </>
          )}
        </main>

        <aside className="w-64 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-500">
          Inspector
        </aside>
      </div>
    </div>
  );
}

export default App;