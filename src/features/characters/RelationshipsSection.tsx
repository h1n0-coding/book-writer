import { useEffect, useRef, useState } from "react";
import {
  createCharacterRelationship,
  listRelationshipsForCharacter,
  updateCharacterRelationship,
  deleteCharacterRelationship,
  type CharacterRelationshipUpdateFields,
} from "../../db/repositories/characterRelationshipRepository";
import { useTranslation } from "../../i18n/useTranslation";
import { useLocaleStore } from "../../stores/localeStore";
import type { Character, CharacterRelationship } from "../../types/db";
import type { Locale } from "../../i18n/translations";

const TYPE_SUGGESTIONS: Record<Locale, string[]> = {
  ru: [
    "друг",
    "враг",
    "семья",
    "брат/сестра",
    "родитель",
    "ребёнок",
    "супруг(а)",
    "возлюбленный(ая)",
    "коллега",
    "соперник",
    "наставник",
    "ученик",
    "знает",
    "не доверяет",
  ],
  en: [
    "friend",
    "enemy",
    "family",
    "sibling",
    "parent",
    "child",
    "spouse",
    "lover",
    "colleague",
    "rival",
    "mentor",
    "student",
    "knows",
    "distrusts",
  ],
};

function relationshipIcon(type: string): string {
  const t = type.toLowerCase();
  const loverWords = ["lover", "spouse", "возлюблен", "супруг"];
  const enemyWords = ["enemy", "rival", "враг", "соперник"];
  const friendWords = ["friend", "друг"];
  const familyWords = ["family", "sibling", "parent", "child", "семь", "брат", "сестр", "родител", "ребён"];
  if (loverWords.some((w) => t.includes(w))) return "❤️";
  if (enemyWords.some((w) => t.includes(w))) return "⚔";
  if (friendWords.some((w) => t.includes(w))) return "🤝";
  if (familyWords.some((w) => t.includes(w))) return "👪";
  return "👤";
}

interface RelationshipsSectionProps {
  bookId: string;
  character: Character;
  allCharacters: Character[];
  onNavigate: (characterId: string) => void;
}

export function RelationshipsSection({
  bookId,
  character,
  allCharacters,
  onNavigate,
}: RelationshipsSectionProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState("");

  const otherCharacters = allCharacters.filter((c) => c.id !== character.id);
  const nameById = new Map(allCharacters.map((c) => [c.id, c.name]));

  async function refresh() {
    try {
      const list = await listRelationshipsForCharacter(character.id);
      setRelationships(list);
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
  }, [character.id]);

  async function handleCreate() {
    if (!targetId || !type.trim()) return;
    try {
      await createCharacterRelationship(bookId, character.id, targetId, type.trim());
      setShowForm(false);
      setTargetId("");
      setType("");
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteRelationship"))) return;
    try {
      await deleteCharacterRelationship(id);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="border-t border-zinc-800 pt-3">
      <datalist id="relationship-type-suggestions">
        {TYPE_SUGGESTIONS[locale].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {t("relationshipsHeading")}
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
            <option value="">{t("selectCharacterOption")}</option>
            {otherCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            list="relationship-type-suggestions"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder={t("relationshipTypePlaceholder")}
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

      {relationships.length === 0 && !showForm && (
        <p className="text-xs text-zinc-600">{t("noRelationshipsYet")}</p>
      )}

      <ul className="flex flex-col gap-2">
        {relationships.map((r) => {
          const isFrom = r.fromCharacterId === character.id;
          const otherId = isFrom ? r.toCharacterId : r.fromCharacterId;
          const otherName = nameById.get(otherId) ?? "?";
          return (
            <RelationshipRow
              key={r.id}
              relationship={r}
              isFrom={isFrom}
              otherName={otherName}
              onNavigate={() => onNavigate(otherId)}
              onDelete={() => handleDelete(r.id)}
              onSaved={refresh}
            />
          );
        })}
      </ul>
    </div>
  );
}

function RelationshipRow({
  relationship,
  isFrom,
  otherName,
  onNavigate,
  onDelete,
  onSaved,
}: {
  relationship: CharacterRelationship;
  isFrom: boolean;
  otherName: string;
  onNavigate: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<CharacterRelationshipUpdateFields>({
    type: relationship.type,
    description: relationship.description,
    strength: relationship.strength,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof CharacterRelationshipUpdateFields>(
    key: K,
    value: CharacterRelationshipUpdateFields[K],
  ) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await updateCharacterRelationship(relationship.id, next);
        setStatus("saved");
        onSaved();
      } catch {
        setStatus("error");
      }
    }, 800);
  }

  const statusLabel: Record<string, string> = {
    idle: t("statusShortUnsaved"),
    saving: t("statusShortSaving"),
    saved: t("statusShortSaved"),
    error: t("statusShortError"),
  };

  return (
    <li className="rounded border border-zinc-800 p-2">
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={onNavigate}
          className="flex items-center gap-1 text-sm text-zinc-200 hover:text-zinc-100"
        >
          <span>{relationshipIcon(fields.type)}</span>
          <span className="truncate">{otherName}</span>
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-400"
        >
          {t("deleteLabel")}
        </button>
      </div>

      <p className="mb-1 text-[11px] text-zinc-600">
        {isFrom ? t("thisCharacterLabel") : otherName} → {fields.type || "…"} →{" "}
        {isFrom ? otherName : t("thisCharacterLabel")}
      </p>

      <input
        list="relationship-type-suggestions"
        value={fields.type}
        onChange={(e) => update("type", e.target.value)}
        className="mb-1 w-full rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
      />
      <textarea
        value={fields.description}
        onChange={(e) => update("description", e.target.value)}
        rows={2}
        placeholder={t("fieldDescription")}
        className="mb-1 w-full resize-none rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
      />
      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <label className="flex items-center gap-1">
          {t("strengthLabel")}
          <input
            type="number"
            value={fields.strength ?? ""}
            onChange={(e) =>
              update(
                "strength",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className="w-14 rounded bg-zinc-900 px-1 py-0.5 text-zinc-200 outline-none"
          />
        </label>
        <span className={status === "error" ? "text-red-400" : ""}>
          {statusLabel[status]}
        </span>
      </div>
    </li>
  );
}