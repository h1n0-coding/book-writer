import { useEffect, useState } from "react";
import { createProject, listProjects } from "../../db/repositories/projectRepository";
import { createBook, listBooksByProject } from "../../db/repositories/bookRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { Project, Book } from "../../types/db";

export function ProjectBookPicker() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeProjectId = useManuscriptStore((s) => s.activeProjectId);
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const setActiveProject = useManuscriptStore((s) => s.setActiveProject);
  const setActiveBook = useManuscriptStore((s) => s.setActiveBook);

  async function refreshProjects(preferId?: string) {
    try {
      const list = await listProjects();
      setProjects(list);
      if (preferId) {
        setActiveProject(preferId);
      } else if (!activeProjectId && list.length > 0) {
        setActiveProject(list[0].id);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  async function refreshBooks(projectId: string, preferId?: string) {
    try {
      const list = await listBooksByProject(projectId);
      setBooks(list);
      if (preferId) {
        setActiveBook(preferId);
      } else if (!activeBookId && list.length > 0) {
        setActiveBook(list[0].id);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      refreshBooks(activeProjectId);
    } else {
      setBooks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  async function handleNewProject() {
    const name = window.prompt(t("promptProjectName"), t("defaultProjectName"));
    if (!name) return;
    try {
      const project = await createProject(name);
      await refreshProjects(project.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleNewBook() {
    if (!activeProjectId) return;
    const title = window.prompt(t("promptBookTitle"), t("defaultBookTitle"));
    if (!title) return;
    try {
      const book = await createBook(activeProjectId, title);
      await refreshBooks(activeProjectId, book.id);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="mb-4 border-b border-zinc-800 pb-3">
      {error && (
        <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">{error}</p>
      )}

      <div className="mb-2 flex items-center gap-1">
        <select
          className="flex-1 rounded bg-zinc-800 px-1 py-1 text-xs text-zinc-200"
          value={activeProjectId ?? ""}
          onChange={(e) => setActiveProject(e.target.value || null)}
        >
          <option value="" disabled>
            {t("selectProject")}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleNewProject}
          className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700"
          title={t("newProjectTooltip")}
        >
          +
        </button>
      </div>

      {activeProjectId && (
        <div className="flex items-center gap-1">
          <select
            className="flex-1 rounded bg-zinc-800 px-1 py-1 text-xs text-zinc-200"
            value={activeBookId ?? ""}
            onChange={(e) => setActiveBook(e.target.value || null)}
          >
            <option value="" disabled>
              {t("selectBook")}
            </option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleNewBook}
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700"
            title={t("newBookTooltip")}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}