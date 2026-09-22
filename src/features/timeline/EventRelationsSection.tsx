import { useEffect, useState } from "react";
import {
  createEventRelation,
  listRelationsForEvent,
  deleteEventRelation,
} from "../../db/repositories/eventRelationRepository";
import { useTranslation } from "../../i18n/useTranslation";
import { useLocaleStore } from "../../stores/localeStore";
import type { Event, EventRelation } from "../../types/db";
import type { Locale } from "../../i18n/translations";

const TYPE_SUGGESTIONS: Record<Locale, string[]> = {
  ru: [
    "вызывает",
    "приводит к",
    "следует за",
    "предшествует",
    "противоречит",
    "зависит от",
    "ссылается на",
  ],
  en: [
    "causes",
    "leads_to",
    "follows",
    "precedes",
    "conflicts_with",
    "depends_on",
    "references",
  ],
};

interface EventRelationsSectionProps {
  bookId: string;
  event: Event;
  allEvents: Event[];
  onNavigate: (eventId: string) => void;
}

export function EventRelationsSection({
  bookId,
  event,
  allEvents,
  onNavigate,
}: EventRelationsSectionProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [relations, setRelations] = useState<EventRelation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState("");

  const otherEvents = allEvents.filter((e) => e.id !== event.id);
  const titleById = new Map(allEvents.map((e) => [e.id, e.title]));

  async function refresh() {
    try {
      const list = await listRelationsForEvent(event.id);
      setRelations(list);
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    refresh();
    setShowForm(false);
    setTargetId("");
    setType("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  async function handleCreate() {
    if (!targetId || !type.trim()) return;
    try {
      await createEventRelation(bookId, event.id, targetId, type.trim());
      setShowForm(false);
      setTargetId("");
      setType("");
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteRelation"))) return;
    try {
      await deleteEventRelation(id);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="border-t border-zinc-800 pt-3">
      <datalist id="event-relation-type-suggestions">
        {TYPE_SUGGESTIONS[locale].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {t("relatedEventsHeading")}
        </span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-200"
        >
          {showForm ? t("cancelLabel") : t("addButton")}
        </button>
      </div>

      {error && (
        <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">{error}</p>
      )}

      {showForm && (
        <div className="mb-3 flex flex-col gap-2 rounded border border-zinc-800 p-2">
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
          >
            <option value="">{t("selectEventOption")}</option>
            {otherEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <input
            list="event-relation-type-suggestions"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder={t("eventRelationTypePlaceholder")}
            className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!targetId || !type.trim()}
            className="self-start rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700 disabled:opacity-30"
          >
            {t("createLabel")}
          </button>
        </div>
      )}

      {relations.length === 0 && !showForm && (
        <p className="text-xs text-zinc-600">{t("noRelatedEventsYet")}</p>
      )}

      <ul className="flex flex-col gap-2">
        {relations.map((r) => {
          const isFrom = r.fromEventId === event.id;
          const otherId = isFrom ? r.toEventId : r.fromEventId;
          const otherTitle = titleById.get(otherId) ?? "?";
          return (
            <li key={r.id} className="rounded border border-zinc-800 p-2">
              <div className="mb-1 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(otherId)}
                  className="truncate text-sm text-zinc-200 hover:text-zinc-100"
                >
                  {otherTitle}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  {t("deleteLabel")}
                </button>
              </div>
              <p className="text-[11px] text-zinc-600">
                {isFrom ? t("thisEventLabel") : otherTitle} → {r.type} →{" "}
                {isFrom ? otherTitle : t("thisEventLabel")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}