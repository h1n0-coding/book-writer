import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createLocation,
  listLocationsByBook,
  updateLocation,
  deleteLocation,
  listScenesForLocation,
  listEventsForLocation,
  listCharactersForLocation,
  type LocationUpdateFields,
} from "../../db/repositories/locationRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type { Character, Event as StoryEvent, Location, Scene } from "../../types/db";

export function LocationsPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const selectedId = useManuscriptStore((s) => s.selectedLocationId);
  const setSelectedLocation = useManuscriptStore((s) => s.setSelectedLocation);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh(preferId?: string) {
    if (!activeBookId) {
      setLocations([]);
      return;
    }
    try {
      const list = await listLocationsByBook(activeBookId);
      setLocations(list);
      if (preferId) {
        setSelectedLocation(preferId);
      } else if (selectedId && !list.some((l) => l.id === selectedId)) {
        setSelectedLocation(list[0]?.id ?? null);
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
    const name = window.prompt(t("promptLocationName"), t("defaultLocationName"));
    if (!name) return;
    try {
      const location = await createLocation(activeBookId, name);
      await refresh(location.id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteLocation"))) return;
    try {
      await deleteLocation(id);
      setSelectedLocation(null);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  const selected = locations.find((l) => l.id === selectedId) ?? null;

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 pr-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">
            {t("locationsHeading")}
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
          {locations.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => setSelectedLocation(l.id)}
                className={`w-full truncate rounded px-2 py-1 text-left text-sm ${
                  selectedId === l.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {l.name}
              </button>
            </li>
          ))}
          {locations.length === 0 && (
            <li className="px-2 text-xs text-zinc-600">{t("noLocationsYet")}</li>
          )}
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <LocationForm
            key={selected.id}
            location={selected}
            onSaved={() => refresh(selected.id)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <p className="text-zinc-500">{t("selectLocationPrompt")}</p>
        )}
      </div>
    </div>
  );
}

function LocationForm({
  location,
  onSaved,
  onDelete,
}: {
  location: Location;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const setSelectedChapter = useManuscriptStore((s) => s.setSelectedChapter);
  const setSelectedScene = useManuscriptStore((s) => s.setSelectedScene);
  const setSelectedEvent = useManuscriptStore((s) => s.setSelectedEvent);
  const setSelectedCharacter = useManuscriptStore((s) => s.setSelectedCharacter);

  const [fields, setFields] = useState<LocationUpdateFields>({
    name: location.name,
    description: location.description,
    notes: location.notes,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [scns, evts, chars] = await Promise.all([
        listScenesForLocation(location.id),
        listEventsForLocation(location.id),
        listCharactersForLocation(location.id),
      ]);
      setScenes(scns);
      setEvents(evts);
      setCharacters(chars);
    })();
  }, [location.id]);

  function update<K extends keyof LocationUpdateFields>(
    key: K,
    value: LocationUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateLocation(location.id, next);
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

      <Field label={t("fieldDescription")}>
        <textarea
          value={fields.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <Field label={t("fieldNotes")}>
        <textarea
          value={fields.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={4}
          className="w-full resize-none rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none"
        />
      </Field>

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-2 text-xs font-medium tracking-wide text-zinc-500">
          {t("usedInHeading")}
        </div>

        <div className="mb-2">
          <div className="mb-1 text-[11px] text-zinc-600">{t("scenesHeading")}</div>
          {scenes.length === 0 ? (
            <p className="text-xs text-zinc-600">{t("usedInNoScenes")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {scenes.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setSelectedChapter(s.chapterId);
                      setSelectedScene(s.id);
                    }}
                    className="text-xs text-zinc-300 underline hover:text-zinc-100"
                  >
                    {s.title} →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-2">
          <div className="mb-1 text-[11px] text-zinc-600">{t("eventsHeading")}</div>
          {events.length === 0 ? (
            <p className="text-xs text-zinc-600">{t("usedInNoEvents")}</p>
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

        <div>
          <div className="mb-1 text-[11px] text-zinc-600">{t("navCharacters")}</div>
          {characters.length === 0 ? (
            <p className="text-xs text-zinc-600">{t("usedInNoCharacters")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {characters.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedCharacter(c.id)}
                    className="text-xs text-zinc-300 underline hover:text-zinc-100"
                  >
                    {c.name} →
                  </button>
                </li>
              ))}
            </ul>
          )}
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