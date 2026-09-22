import { useEffect, useRef, useState } from "react";
import {
  createNote,
  listNotesByBook,
  updateNote,
  deleteNote,
  type NoteUpdateFields,
} from "../../db/repositories/noteRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { Note } from "../../types/db";

export function NotesPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh(preferId?: string) {
    if (!activeBookId) {
      setNotes([]);
      return;
    }
    try {
      const list = await listNotesByBook(activeBookId);
      setNotes(list);
      if (preferId) {
        setSelectedId(preferId);
      } else if (selectedId && !list.some((n) => n.id === selectedId)) {
        setSelectedId(list[0]?.id ?? null);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    setSelectedId(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  async function handleAdd() {
    if (!activeBookId) return;
    const title = window.prompt(t("promptNoteTitle"), t("defaultNoteTitle"));
    if (!title) return;
    try {
      const note = await createNote(activeBookId, title);
      await refresh(note.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteNote"))) return;
    try {
      await deleteNote(id);
      setSelectedId(null);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 pr-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">
            {t("notesHeading")}
          </span>
          <button
            onClick={handleAdd}
            className="text-xs text-zinc-500 hover:text-zinc-200"
          >
            {t("addButton")}
          </button>
        </div>
        {error && (
          <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">
            {error}
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelectedId(n.id)}
                className={`w-full truncate rounded px-2 py-1 text-left text-sm ${
                  selectedId === n.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {n.title}
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="px-2 text-xs text-zinc-600">{t("noNotesYet")}</li>
          )}
        </ul>
      </div>

      <div className="flex-1 overflow-hidden">
        {selected ? (
          <NoteForm
            key={selected.id}
            note={selected}
            onSaved={() => refresh(selected.id)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <p className="text-zinc-500">{t("selectNotePrompt")}</p>
        )}
      </div>
    </div>
  );
}

function NoteForm({
  note,
  onSaved,
  onDelete,
}: {
  note: Note;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<NoteUpdateFields>({
    title: note.title,
    content: note.content,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof NoteUpdateFields>(
    key: K,
    value: NoteUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateNote(note.id, next);
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  const statusLabel: Record<string, string> = {
    idle: t("statusUnsaved"),
    saving: t("statusSaving"),
    saved: t("statusSaved"),
    error: t("statusError"),
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <input
          value={fields.title}
          onChange={(e) => update("title", e.target.value)}
          className="w-full rounded bg-transparent text-lg text-zinc-100 outline-none"
        />
        <button
          onClick={onDelete}
          className="ml-3 shrink-0 text-xs text-red-500 hover:text-red-400"
        >
          {t("deleteLabel")}
        </button>
      </div>
      <span className="text-xs text-zinc-500">{statusLabel[status]}</span>

      <textarea
        value={fields.content}
        onChange={(e) => update("content", e.target.value)}
        placeholder={t("writeNotePlaceholder")}
        className="flex-1 resize-none rounded border border-zinc-800 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-100 outline-none focus:border-zinc-700"
      />
    </div>
  );
}