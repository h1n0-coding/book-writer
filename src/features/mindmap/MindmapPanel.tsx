import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type Edge,
  type OnConnect,
  type NodeChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  createEvent,
  listEventsByBook,
  updateEvent,
  updateEventPosition,
  deleteEvent,
  listCharactersForEvent,
  listLocationsForEvent,
  listScenesForEvent,
} from "../../db/repositories/eventRepository";
import {
  createEventRelation,
  listRelationsByBook,
  deleteEventRelation,
} from "../../db/repositories/eventRelationRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  Event as StoryEvent,
  EventRelation,
  Character,
  Location,
  Scene,
  ChapterStatus,
} from "../../types/db";

function statusColor(status: string): string {
  if (status === "done") return "#14532d";
  if (status === "in_progress") return "#1e3a5f";
  return "#3f3f46";
}

const GRID_COLUMNS = 4;
const GRID_SPACING_X = 240;
const GRID_SPACING_Y = 150;

export function MindmapPanel() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [relations, setRelations] = useState<EventRelation[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function autoLayoutIfNeeded(
    bookId: string,
    allEvents: StoryEvent[],
  ): Promise<boolean> {
    const unset = allEvents.filter((e) => !e.positionSet);
    if (unset.length === 0) return false;
    for (let i = 0; i < unset.length; i++) {
      const x = (i % GRID_COLUMNS) * GRID_SPACING_X;
      const y = Math.floor(i / GRID_COLUMNS) * GRID_SPACING_Y;
      await updateEventPosition(unset[i].id, x, y);
    }
    return true;
  }

  async function refresh(preferSelectedId?: string) {
    if (!activeBookId) {
      setEvents([]);
      setRelations([]);
      return;
    }
    try {
      let eventList = await listEventsByBook(activeBookId);
      const relaidOut = await autoLayoutIfNeeded(activeBookId, eventList);
      if (relaidOut) {
        eventList = await listEventsByBook(activeBookId);
      }
      const relationList = await listRelationsByBook(activeBookId);
      setEvents(eventList);
      setRelations(relationList);
      if (preferSelectedId) setSelectedEventId(preferSelectedId);
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    setSelectedEventId(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookId]);

  useEffect(() => {
    setRfNodes(
      events.map((e) => ({
        id: e.id,
        position: { x: e.positionX, y: e.positionY },
        data: { label: e.title },
        style: {
          background: statusColor(e.status),
          color: "#e4e4e7",
          border:
            selectedEventId === e.id
              ? "2px solid #a1a1aa"
              : "1px solid #3f3f46",
          borderRadius: 6,
          fontSize: 12,
          padding: 8,
        },
      })),
    );
  }, [events, selectedEventId]);

  useEffect(() => {
    setRfEdges(
      relations.map((r) => ({
        id: r.id,
        source: r.fromEventId,
        target: r.toEventId,
        label: r.type,
        style: { stroke: "#52525b" },
        labelStyle: { fill: "#a1a1aa", fontSize: 10 },
      })),
    );
  }, [relations]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStop: NodeMouseHandler = useCallback((_evt, node) => {
    updateEventPosition(node.id, node.position.x, node.position.y).catch(
      (err) => setError(String(err)),
    );
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelectedEventId(node.id);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback(
    async (_evt, edge) => {
      if (!window.confirm(t("confirmDeleteRelation"))) return;
      try {
        await deleteEventRelation(edge.id);
        await refresh();
      } catch (err) {
        setError(String(err));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const onConnect: OnConnect = useCallback(
    async (params) => {
      if (!params.source || !params.target || !activeBookId) return;
      const type = window.prompt(
        t("relationPromptTitle"),
        t("defaultRelationType"),
      );
      if (!type) return;
      try {
        await createEventRelation(activeBookId, params.source, params.target, type);
        await refresh();
      } catch (err) {
        setError(String(err));
      }
    },
    [activeBookId, t],
  );

  async function handleAddEvent() {
    if (!activeBookId) return;
    const title = window.prompt(t("promptEventTitle"), t("defaultEventTitle"));
    if (!title) return;
    try {
      const event = await createEvent(activeBookId, title);
      const index = events.length;
      const x = (index % GRID_COLUMNS) * GRID_SPACING_X;
      const y = Math.floor(index / GRID_COLUMNS) * GRID_SPACING_Y;
      await updateEventPosition(event.id, x, y);
      await refresh(event.id);
    } catch (err) {
      setError(String(err));
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  if (!activeBookId) {
    return <p className="text-zinc-500">{t("selectBookFirst")}</p>;
  }

  return (
    <div className="flex h-full gap-3">
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">
            {t("storyMapHeading")}
          </span>
          <button
            onClick={handleAddEvent}
            className="text-xs text-zinc-500 hover:text-zinc-200"
          >
            {t("addEventButton")}
          </button>
        </div>
        {error && (
          <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">
            {error}
          </p>
        )}
        <div className="relative min-h-0 flex-1 rounded border border-zinc-800 bg-zinc-950">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
            colorMode="dark"
            fitView
          >
            <Background color="#3f3f46" gap={20} />
            <Controls />
            <MiniMap
              pannable
              zoomable
              nodeColor={() => "#52525b"}
              maskColor="rgba(0,0,0,0.6)"
            />
          </ReactFlow>
        </div>
        {events.length === 0 && (
          <p className="mt-2 text-xs text-zinc-600">{t("noEventsMindmapHint")}</p>
        )}
      </div>

      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onSaved={() => refresh(selectedEvent.id)}
          onDeleted={() => {
            setSelectedEventId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function EventDetailPanel({
  event,
  onClose,
  onSaved,
  onDeleted,
}: {
  event: StoryEvent;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const setSelectedChapter = useManuscriptStore((s) => s.setSelectedChapter);
  const setSelectedScene = useManuscriptStore((s) => s.setSelectedScene);
  const setSelectedCharacter = useManuscriptStore((s) => s.setSelectedCharacter);
  const setSelectedLocation = useManuscriptStore((s) => s.setSelectedLocation);

  const [fields, setFields] = useState({
    title: event.title,
    description: event.description,
    dateValue: event.dateValue,
    status: event.status,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFields({
      title: event.title,
      description: event.description,
      dateValue: event.dateValue,
      status: event.status,
    });
    (async () => {
      const [c, l, s] = await Promise.all([
        listCharactersForEvent(event.id),
        listLocationsForEvent(event.id),
        listScenesForEvent(event.id),
      ]);
      setCharacters(c);
      setLocations(l);
      setScenes(s);
    })();
  }, [event.id]);

  function update<K extends keyof typeof fields>(
    key: K,
    value: (typeof fields)[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateEvent(event.id, {
          title: next.title,
          description: next.description,
          dateValue: next.dateValue,
          status: next.status,
          chapterId: event.chapterId,
        });
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteEvent"))) return;
    await deleteEvent(event.id);
    onDeleted();
  }

  function handleOpenScene(scene: Scene) {
    setSelectedChapter(scene.chapterId);
    setSelectedScene(scene.id);
  }

  const statusLabel: Record<string, string> = {
    idle: t("statusShortUnsaved"),
    saving: t("statusShortSaving"),
    saved: t("statusShortSaved"),
    error: t("statusShortError"),
  };

  const statusOptionLabel: Record<ChapterStatus, string> = {
    draft: t("statusDraft"),
    in_progress: t("statusInProgress"),
    done: t("statusDone"),
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {t("eventPanelHeading")}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-200"
        >
          {t("closeLabel")}
        </button>
      </div>

      <input
        value={fields.title}
        onChange={(e) => update("title", e.target.value)}
        className="rounded bg-transparent text-base text-zinc-100 outline-none"
      />

      <div className="flex items-center gap-2">
        <select
          value={fields.status}
          onChange={(e) => update("status", e.target.value)}
          className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none"
        >
          <option value="draft">{statusOptionLabel.draft}</option>
          <option value="in_progress">{statusOptionLabel.in_progress}</option>
          <option value="done">{statusOptionLabel.done}</option>
        </select>
        <span className="text-xs text-zinc-600">{statusLabel[status]}</span>
      </div>

      <input
        value={fields.dateValue}
        onChange={(e) => update("dateValue", e.target.value)}
        placeholder={t("dateLabelPlaceholder")}
        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none"
      />

      <textarea
        value={fields.description}
        onChange={(e) => update("description", e.target.value)}
        rows={4}
        placeholder={t("fieldDescription")}
        className="resize-none rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none"
      />

      <div>
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("navCharacters")}
        </div>
        {characters.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("noneLinked")}</p>
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

      <div>
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("navLocations")}
        </div>
        {locations.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("noneLinked")}</p>
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

      <div>
        <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          {t("scenesHeading")}
        </div>
        {scenes.length === 0 && (
          <p className="text-xs text-zinc-400">{t("noneLinked")}</p>
        )}
        <ul className="flex flex-col gap-1">
          {scenes.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => handleOpenScene(s)}
                className="text-xs text-zinc-300 underline hover:text-zinc-100"
              >
                {s.title} →
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => useManuscriptStore.getState().setActiveView("timeline")}
        className="self-start text-xs text-zinc-500 hover:text-zinc-200"
      >
        {t("editLinksInTimeline")}
      </button>

      <button
        onClick={handleDelete}
        className="mt-auto self-start text-xs text-red-500 hover:text-red-400"
      >
        {t("deleteEventButton")}
      </button>
    </div>
  );
}