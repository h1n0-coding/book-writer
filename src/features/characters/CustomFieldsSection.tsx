import { useEffect, useRef, useState } from "react";
import {
  createCharacterField,
  listFieldsByCharacter,
  updateCharacterField,
  deleteCharacterField,
} from "../../db/repositories/characterFieldRepository";
import { useTranslation } from "../../i18n/useTranslation";
import type { CharacterField } from "../../types/db";

export function CustomFieldsSection({ characterId }: { characterId: string }) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<CharacterField[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setFields(await listFieldsByCharacter(characterId));
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  async function handleAdd() {
    const name = window.prompt(t("promptFieldName"), t("defaultFieldName"));
    if (!name) return;
    try {
      await createCharacterField(characterId, name);
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="border-t border-zinc-800 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-zinc-500">
          {t("customFieldsHeading")}
        </span>
        <button
          onClick={handleAdd}
          className="text-xs text-zinc-500 hover:text-zinc-200"
        >
          {t("addButton")}
        </button>
      </div>
      {error && (
        <p className="mb-2 rounded bg-red-950 p-1 text-xs text-red-400">{error}</p>
      )}
      {fields.length === 0 && (
        <p className="text-xs text-zinc-600">{t("noCustomFieldsYet")}</p>
      )}
      <ul className="flex flex-col gap-2">
        {fields.map((f) => (
          <CustomFieldRow
            key={f.id}
            field={f}
            onSaved={refresh}
            onDeleted={refresh}
          />
        ))}
      </ul>
    </div>
  );
}

function CustomFieldRow({
  field,
  onSaved,
  onDeleted,
}: {
  field: CharacterField;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(field.name);
  const [value, setValue] = useState(field.value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(nextName: string, nextValue: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await updateCharacterField(field.id, { name: nextName, value: nextValue });
        onSaved();
      } catch {
        // A single custom-field row failing to save silently isn't critical
        // enough to interrupt the rest of the form with an error banner.
      }
    }, 800);
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDeleteField"))) return;
    await deleteCharacterField(field.id);
    onDeleted();
  }

  return (
    <li className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          scheduleSave(e.target.value, value);
        }}
        className="w-1/3 rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none"
      />
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          scheduleSave(name, e.target.value);
        }}
        className="flex-1 rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none"
      />
      <button
        onClick={handleDelete}
        className="shrink-0 text-xs text-red-500 hover:text-red-400"
      >
        {t("deleteLabel")}
      </button>
    </li>
  );
}