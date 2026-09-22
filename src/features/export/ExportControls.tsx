import { useState } from "react";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { getBookById } from "../../db/repositories/bookRepository";
import { exportManuscriptToFile } from "../../lib/manuscriptExport";
import { backupDatabase } from "../../lib/backup";
import { useTranslation } from "../../i18n/useTranslation";

export function ExportControls() {
  const { t } = useTranslation();
  const activeBookId = useManuscriptStore((s) => s.activeBookId);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!activeBookId) return;
    setMessage(null);
    setError(null);
    try {
      const book = await getBookById(activeBookId);
      if (!book) return;
      const path = await exportManuscriptToFile(activeBookId, book.title);
      if (path) setMessage(`${t("exportedToPrefix")} ${path}`);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleBackup() {
    setMessage(null);
    setError(null);
    try {
      const path = await backupDatabase();
      setMessage(`${t("backupSavedToPrefix")} ${path}`);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={handleExport}
        disabled={!activeBookId}
        className="rounded bg-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-700 disabled:opacity-30"
      >
        {t("exportManuscript")}
      </button>
      <button
        onClick={handleBackup}
        className="rounded bg-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-700"
      >
        {t("backupNow")}
      </button>
      {message && (
        <span className="max-w-xs truncate text-zinc-500" title={message}>
          {message}
        </span>
      )}
      {error && (
        <span className="max-w-xs truncate text-red-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}