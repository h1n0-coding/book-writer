import { useState } from "react";

interface EntityLinkerProps<T extends { id: string }> {
  label: string;
  addPlaceholder: string;
  noneLinkedText: string;
  allItems: T[];
  linkedItems: T[];
  getLabel: (item: T) => string;
  onLink: (id: string) => void;
  onUnlink: (id: string) => void;
}

export function EntityLinker<T extends { id: string }>({
  label,
  addPlaceholder,
  noneLinkedText,
  allItems,
  linkedItems,
  getLabel,
  onLink,
  onUnlink,
}: EntityLinkerProps<T>) {
  const [selectValue, setSelectValue] = useState("");
  const linkedIds = new Set(linkedItems.map((i) => i.id));
  const available = allItems.filter((i) => !linkedIds.has(i.id));

  function handleAdd() {
    if (!selectValue) return;
    onLink(selectValue);
    setSelectValue("");
  }

  return (
    <div>
      <div className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
        {label.toUpperCase()}
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {linkedItems.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200"
          >
            {getLabel(item)}
            <button
              onClick={() => onUnlink(item.id)}
              className="text-zinc-500 hover:text-red-400"
              title="×"
            >
              ×
            </button>
          </span>
        ))}
        {linkedItems.length === 0 && (
          <span className="text-xs text-zinc-600">{noneLinkedText}</span>
        )}
      </div>
      {available.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            className="flex-1 rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
          >
            <option value="">{addPlaceholder}</option>
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {getLabel(item)}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectValue}
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-700 disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}