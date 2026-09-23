import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createEvent,
  listEventsByBook,
  updateEvent,
  deleteEvent,
  moveEvent,
  linkEventToScene,
  unlinkEventFromScene,
  listScenesForEvent,
  linkEventToCharacter,
  unlinkEventFromCharacter,
  listCharactersForEvent,
  linkEventToLocation,
  unlinkEventFromLocation,
  listLocationsForEvent,
  type EventUpdateFields,
} from "../../db/repositories/eventRepository";
import { listChaptersByBook } from "../../db/repositories/chapterRepository";
import { listCharactersByBook } from "../../db/repositories/characterRepository";
import { listLocationsByBook } from "../../db/repositories/locationRepository";
import { listScenesByBook } from "../../db/repositories/sceneRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import { EntityLinker } from "./EntityLinker";
import { EventRelationsSection } from "./EventRelationsSection";
import type {
  Event as TimelineEvent,
  Chapter,
  Character,
  Location,
  Scene,
  ChapterStatus,
} from "../../types/db";

const STATUS_OPTIONS: ChapterStatus[] = ["draft", "in_progress", "done"];

export function TimelinePanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const selectedId = useManuscriptStore((s) => s.selectedEventId);
  const setSelectedEvent = useManuscriptStore((s) => s.setSelectedEvent);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh(preferId?: string) {
    if (!activeBookId) {
      setEvents([]);
      setChapters([]);
      setCharacters([]);
      setLocations([]);
      setScenes([]);
      return;
    }
    try {
      const [eventList, chapterList, characterList, locationList, sceneList] =
        await Promise.all([
          listEventsByBook(activeBookId),
          listChaptersByBook(activeBookId),
          listCharactersByBook(activeBookId),
          listLocationsByBook(activeBookId),
          listScenesByBook(activeBookId),
        ]);
      setEvents(eventList);
      setChapters(chapterList);
      setCharacters(characterList);
      setLocations(locationList);
      setScenes(sceneList);
      if (preferId) {
        setSelectedEvent(preferId);
      } else if (selectedId && !eventList.some((e) => e.id === selectedId)) {
        setSelectedEvent(eventList[0]?.id ?? null);
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
    const title = window.prompt(t("promptEventTitle"), t("defaultEventTitle"));
    if (!title) return;
    try {
      const event = await createEvent(activeBookId, title);
      await refresh(event.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteEvent"))) return;
    try {
      await deleteEvent(id);
      setSelectedEvent(null);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleMove(eventId: string, direction: "up" | "down") {
    if (!activeBookId) return;
    try {
      await moveEvent(activeBookId, eventId, direction);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  const selected = events.find((e) => e.id === selectedId) ?? null;

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-zinc-800 pr-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">
            {t("timelineHeading")}
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
        <ul className="relative flex flex-col gap-1 border-l border-zinc-800 pl-4">
          {events.map((e, index) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-600" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedEvent(e.id)}
                  className={`flex-1 truncate rounded px-2 py-1 text-left text-sm ${
                    selectedId === e.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <span className="block truncate">{e.title}</span>
                  {e.dateValue && (
                    <span className="block text-xs text-zinc-600">
                      {e.dateValue}
                    </span>
                  )}
                </button>
                <div className="flex flex-col">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(e.id, "up")}
                    className="text-[10px] text-zinc-600 hover:text-zinc-200 disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    disabled={index === events.length - 1}
                    onClick={() => handleMove(e.id, "down")}
                    className="text-[10px] text-zinc-600 hover:text-zinc-200 disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </li>
          ))}
          {events.length === 0 && (
            <li className="px-2 text-xs text-zinc-600">{t("noEventsYet")}</li>
          )}
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <EventForm
            key={selected.id}
            bookId={activeBookId}
            event={selected}
            chapters={chapters}
            allCharacters={characters}
            allLocations={locations}
            allScenes={scenes}
            allEvents={events}
            onSaved={() => refresh(selected.id)}
            onDelete={() => handleDelete(selected.id)}
            onNavigate={(id) => setSelectedEvent(id)}
          />
        ) : (
          <p className="text-zinc-500">{t("selectEventPrompt")}</p>
        )}
      </div>
    </div>
  );
}

function EventForm({
  bookId,
  event,
  chapters,
  allCharacters,
  allLocations,
  allScenes,
  allEvents,
  onSaved,
  onDelete,
  onNavigate,
}: {
  bookId: string;
  event: TimelineEvent;
  chapters: Chapter[];
  allCharacters: Character[];
  allLocations: Location[];
  allScenes: Scene[];
  allEvents: TimelineEvent[];
  onSaved: () => void;
  onDelete: () => void;
  onNavigate: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<EventUpdateFields>({
    title: event.title,
    description: event.description,
    dateValue: event.dateValue,
    chapterId: event.chapterId,
    status: event.status,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [linkedCharacters, setLinkedCharacters] = useState<Character[]>([]);
  const [linkedLocations, setLinkedLocations] = useState<Location[]>([]);
  const [linkedScenes, setLinkedScenes] = useState<Scene[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [chars, locs, scns] = await Promise.all([
        listCharactersForEvent(event.id),
        listLocationsForEvent(event.id),
        listScenesForEvent(event.id),
      ]);
      setLinkedCharacters(chars);
      setLinkedLocations(locs);
      setLinkedScenes(scns);
    })();
  }, [event.id]);

  function update<K extends keyof EventUpdateFields>(
    key: K,
    value: EventUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateEvent(event.id, next);
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  async function handleLinkCharacter(id: string) {
    await linkEventToCharacter(event.id, id);
    setLinkedCharacters(await listCharactersForEvent(event.id));
  }
  async function handleUnlinkCharacter(id: string) {
    await unlinkEventFromCharacter(event.id, id);
    setLinkedCharacters(await listCharactersForEvent(event.id));
  }

  async function handleLinkLocation(id: string) {
    await linkEventToLocation(event.id, id);
    setLinkedLocations(await listLocationsForEvent(event.id));
  }
  async function handleUnlinkLocation(id: string) {
    await unlinkEventFromLocation(event.id, id);
    setLinkedLocations(await listLocationsForEvent(event.id));
  }

  async function handleLinkScene(id: string) {
    await linkEventToScene(event.id, id);
    setLinkedScenes(await listScenesForEvent(event.id));
  }
  async function handleUnlinkScene(id: string) {
    await unlinkEventFromScene(event.id, id);
    setLinkedScenes(await listScenesForEvent(event.id));
  }

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
    <div className="flex flex-col gap-4 pb-6">
      <div>
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
      </div>

      <div className="flex gap-3">
        <Field label={t("fieldStatus")}>
          <select
            value={fields.status}
            onChange={(e) => update("status", e.target.value)}
            className="rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusOptionLabel[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("fieldDateLabel")}>
          <input
            value={fields.dateValue}
            onChange={(e) => update("dateValue", e.target.value)}
            placeholder={t("dateLabelPlaceholder")}
            className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
          />
        </Field>
      </div>

      <Field label={t("fieldLinkedChapter")}>
        <select
          value={fields.chapterId ?? ""}
          onChange={(e) => update("chapterId", e.target.value || null)}
          className="w-full rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        >
          <option value="">{t("noneOption")}</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("fieldDescription")}>
        <textarea
          value={fields.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <EntityLinker
        label={t("navCharacters")}
        addPlaceholder={t("addCharacterPlaceholder")}
        noneLinkedText={t("noneLinked")}
        allItems={allCharacters}
        linkedItems={linkedCharacters}
        getLabel={(c) => c.name}
        onLink={handleLinkCharacter}
        onUnlink={handleUnlinkCharacter}
      />

      <EntityLinker
        label={t("navLocations")}
        addPlaceholder={t("addLocationPlaceholder")}
        noneLinkedText={t("noneLinked")}
        allItems={allLocations}
        linkedItems={linkedLocations}
        getLabel={(l) => l.name}
        onLink={handleLinkLocation}
        onUnlink={handleUnlinkLocation}
      />

      <EntityLinker
        label={t("scenesHeading")}
        addPlaceholder={t("addScenePlaceholder")}
        noneLinkedText={t("noneLinked")}
        allItems={allScenes}
        linkedItems={linkedScenes}
        getLabel={(s) => s.title}
        onLink={handleLinkScene}
        onUnlink={handleUnlinkScene}
      />

      <EventRelationsSection
        bookId={bookId}
        event={event}
        allEvents={allEvents}
        onNavigate={onNavigate}
      />
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