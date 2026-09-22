import { useEffect, useRef, useState } from "react";
import { getSceneById, updateSceneContent } from "../../db/repositories/sceneRepository";
import { useManuscriptStore } from "../../stores/manuscriptStore";
import { TiptapEditor } from "./TiptapEditor";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SceneEditor() {
  const selectedSceneId = useManuscriptStore((s) => s.selectedSceneId);
  const [title, setTitle] = useState<string>("");
  const [initialContent, setInitialContent] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestHtmlRef = useRef<string>("");

  useEffect(() => {
    setLoaded(false);

    if (!selectedSceneId) {
      setTitle("");
      setInitialContent("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const scene = await getSceneById(selectedSceneId);
        if (cancelled || !scene) return;
        setTitle(scene.title);
        setInitialContent(scene.content);
        latestHtmlRef.current = scene.content;
        setWordCount(
          scene.content
            .replace(/<[^>]*>/g, " ")
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
        );
        setStatus("idle");
        setLoaded(true);
      } catch (err) {
        setError(String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSceneId]);

  function handleEditorUpdate({ html, text }: { html: string; text: string }) {
    latestHtmlRef.current = html;
    setStatus("idle");
    const trimmed = text.trim();
    setWordCount(trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const sceneId = selectedSceneId;
    timeoutRef.current = setTimeout(async () => {
      if (!sceneId) return;
      setStatus("saving");
      try {
        await updateSceneContent(sceneId, html);
        setStatus("saved");
      } catch (err) {
        setError(String(err));
        setStatus("error");
      }
    }, 800);
  }

  // Ctrl+S / Cmd+S: force immediate save, bypassing the debounce.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!selectedSceneId) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setStatus("saving");
        updateSceneContent(selectedSceneId, latestHtmlRef.current)
          .then(() => setStatus("saved"))
          .catch((err) => {
            setError(String(err));
            setStatus("error");
          });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSceneId]);

  if (!selectedSceneId) {
    return (
      <p className="text-zinc-500">Select a scene from the manuscript tree.</p>
    );
  }

  const statusLabel: Record<SaveStatus, string> = {
    idle: "Unsaved changes",
    saving: "Saving…",
    saved: "Saved",
    error: "Error saving",
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-zinc-200">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{wordCount} words</span>
          <span className={status === "error" ? "text-red-400" : "text-zinc-500"}>
            {statusLabel[status]}
          </span>
        </div>
      </div>

      {error && (
        <p className="mb-2 rounded bg-red-950 p-2 text-xs text-red-400">{error}</p>
      )}

      {!loaded && <p className="text-sm text-zinc-600">Loading scene…</p>}

      {loaded && (
        <TiptapEditor
          key={selectedSceneId}
          initialContent={initialContent}
          onUpdate={handleEditorUpdate}
        />
      )}
    </div>
  );
}