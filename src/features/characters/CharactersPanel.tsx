import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createCharacter,
  listCharactersByBook,
  updateCharacter,
  deleteCharacter,
  listChaptersForCharacter,
  listLocationsForCharacter,
  getFirstPovSceneInChapter,
  type CharacterUpdateFields,
} from "../../db/repositories/characterRepository";
import { listEventsForCharacter } from "../../db/repositories/eventRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { Character, Chapter, Event as StoryEvent, Location } from "../../types/db";
import { RelationshipsSection } from "./RelationshipsSection";
import { CustomFieldsSection } from "./CustomFieldsSection";

export function CharactersPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const selectedId = useManuscriptStore((s) => s.selectedCharacterId);
  const setSelectedCharacter = useManuscriptStore((s) => s.setSelectedCharacter);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh(preferId?: string) {
    if (!activeBookId) {
      setCharacters([]);
      return;
    }
    try {
      const list = await listCharactersByBook(activeBookId);
      setCharacters(list);
      if (preferId) {
        setSelectedCharacter(preferId);
      } else if (selectedId && !list.some((c) => c.id === selectedId)) {
        setSelectedCharacter(list[0]?.id ?? null);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  async function handleAdd() {
    if (!activeBookId) return;
    const name = window.prompt(t("promptCharacterName"), t("defaultCharacterName"));
    if (!name) return;
    try {
      const character = await createCharacter(activeBookId, name);
      await refresh(character.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteCharacter"))) return;
    try {
      await deleteCharacter(id);
      setSelectedCharacter(null);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  const selected = characters.find((c) => c.id === selectedId) ?? null;

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 pr-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">
            {t("charactersHeading")}
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
          {characters.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedCharacter(c.id)}
                className={`w-full truncate rounded px-2 py-1 text-left text-sm ${
                  selectedId === c.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
          {characters.length === 0 && (
            <li className="px-2 text-xs text-zinc-600">{t("noCharactersYet")}</li>
          )}
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <CharacterForm
            key={selected.id}
            character={selected}
            bookId={activeBookId}
            allCharacters={characters}
            onSaved={() => refresh(selected.id)}
            onDelete={() => handleDelete(selected.id)}
            onNavigate={(id) => setSelectedCharacter(id)}
          />
        ) : (
          <p className="text-zinc-500">{t("selectCharacterPrompt")}</p>
        )}
      </div>
    </div>
  );
}

function CharacterForm({
  character,
  bookId,
  allCharacters,
  onSaved,
  onDelete,
  onNavigate,
}: {
  character: Character;
  bookId: string;
  allCharacters: Character[];
  onSaved: () => void;
  onDelete: () => void;
  onNavigate: (id: string) => void;
}) {
  const { t } = useTranslation();
  const setSelectedChapter = useManuscriptStore((s) => s.setSelectedChapter);
  const setSelectedScene = useManuscriptStore((s) => s.setSelectedScene);
  const setSelectedEvent = useManuscriptStore((s) => s.setSelectedEvent);
  const setSelectedLocation = useManuscriptStore((s) => s.setSelectedLocation);

  const [fields, setFields] = useState<CharacterUpdateFields>({
    name: character.name,
    description: character.description,
    age: character.age,
    occupation: character.occupation,
    goals: character.goals,
    fears: character.fears,
    secrets: character.secrets,
    notes: character.notes,
    aliases: character.aliases,
    role: character.role,
    appearance: character.appearance,
    personality: character.personality,
    backstory: character.backstory,
    arcBeginning: character.arcBeginning,
    arcMiddle: character.arcMiddle,
    arcEnd: character.arcEnd,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [chaps, evts, locs] = await Promise.all([
        listChaptersForCharacter(character.id),
        listEventsForCharacter(character.id),
        listLocationsForCharacter(character.id),
      ]);
      setChapters(chaps);
      setEvents(evts);
      setLocations(locs);
    })();
  }, [character.id]);

  function update<K extends keyof CharacterUpdateFields>(
    key: K,
    value: CharacterUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateCharacter(character.id, next);
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  async function handleOpenChapter(chapterId: string) {
    const sceneId = await getFirstPovSceneInChapter(character.id, chapterId);
    setSelectedChapter(chapterId);
    if (sceneId) setSelectedScene(sceneId);
  }

  const statusLabel: Record<string, string> = {
    idle: t("statusUnsaved"),
    saving: t("statusSaving"),
    saved: t("statusSaved"),
    error: t("statusError"),
  };

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex items-center justify-between">
        <input
          value={fields.name}
          onChange={(e) => update("name", e.target.value)}
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

      <Field label={t("aliasesLabel")}>
        <input
          value={fields.aliases}
          onChange={(e) => update("aliases", e.target.value)}
          className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("roleLabel")}>
        <input
          value={fields.role}
          onChange={(e) => update("role", e.target.value)}
          className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldAge")}>
        <input
          type="number"
          value={fields.age ?? ""}
          onChange={(e) =>
            update("age", e.target.value === "" ? null : Number(e.target.value))
          }
          className="w-24 rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldOccupation")}>
        <input
          value={fields.occupation}
          onChange={(e) => update("occupation", e.target.value)}
          className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldDescription")}>
        <textarea
          value={fields.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("appearanceLabel")}>
        <textarea
          value={fields.appearance}
          onChange={(e) => update("appearance", e.target.value)}
          rows={2}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("personalityLabel")}>
        <textarea
          value={fields.personality}
          onChange={(e) => update("personality", e.target.value)}
          rows={2}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldGoals")}>
        <textarea
          value={fields.goals}
          onChange={(e) => update("goals", e.target.value)}
          rows={2}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldFears")}>
        <textarea
          value={fields.fears}
          onChange={(e) => update("fears", e.target.value)}
          rows={2}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldSecrets")}>
        <textarea
          value={fields.secrets}
          onChange={(e) => update("secrets", e.target.value)}
          rows={2}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("backstoryLabel")}>
        <textarea
          value={fields.backstory}
          onChange={(e) => update("backstory", e.target.value)}
          rows={3}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldNotes")}>
        <textarea
          value={fields.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <CustomFieldsSection characterId={character.id} />

      <RelationshipsSection
        bookId={bookId}
        character={character}
        allCharacters={allCharacters}
        onNavigate={onNavigate}
      />

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("appearancesHeading")}
        </div>
        {chapters.length === 0 ? (
          <p className="text-xs text-zinc-600">{t("noAppearancesYet")}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {chapters.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => handleOpenChapter(c.id)}
                  className="text-xs text-zinc-300 underline hover:text-zinc-100"
                >
                  {c.title} →
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("eventsHeading")}
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-zinc-600">{t("noEventsForCharacter")}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {events.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedEvent(e.id)}
                  className="text-xs text-zinc-300 underline hover:text-zinc-100"
                >
                  {e.title} →
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("navLocations")}
        </div>
        {locations.length === 0 ? (
          <p className="text-xs text-zinc-600">{t("noLocationsForCharacter")}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {locations.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => setSelectedLocation(l.id)}
                  className="text-xs text-zinc-300 underline hover:text-zinc-100"
                >
                  {l.name} →
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-2 text-xs font-medium tracking-wide text-zinc-500">
          {t("arcHeading")}
        </div>
        <div className="flex flex-col gap-2">
          <Field label={t("arcBeginningLabel")}>
            <textarea
              value={fields.arcBeginning}
              onChange={(e) => update("arcBeginning", e.target.value)}
              rows={2}
              className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
            />
          </Field>
          <Field label={t("arcMiddleLabel")}>
            <textarea
              value={fields.arcMiddle}
              onChange={(e) => update("arcMiddle", e.target.value)}
              rows={2}
              className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
            />
          </Field>
          <Field label={t("arcEndLabel")}>
            <textarea
              value={fields.arcEnd}
              onChange={(e) => update("arcEnd", e.target.value)}
              rows={2}
              className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      {children}
    </label>
  );
}