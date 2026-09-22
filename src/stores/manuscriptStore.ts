import { create } from "zustand";

export type ManuscriptView =
  | "manuscript"
  | "characters"
  | "locations"
  | "timeline"
  | "mindmap"
  | "roadmap"
  | "notes"
  | "relationships"
  | "search";

interface ManuscriptState {
  activeView: ManuscriptView;
  activeProjectId: string | null;
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
  selectedEventId: string | null;
  selectedLocationId: string | null;
  setActiveView: (view: ManuscriptView) => void;
  setActiveProject: (id: string | null) => void;
  setActiveBook: (id: string | null) => void;
  setSelectedChapter: (id: string | null) => void;
  setSelectedScene: (id: string | null) => void;
  setSelectedCharacter: (id: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  setSelectedLocation: (id: string | null) => void;
}

export const useManuscriptStore = create<ManuscriptState>((set) => ({
  activeView: "manuscript",
  activeProjectId: null,
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
  selectedEventId: null,
  selectedLocationId: null,
  setActiveView: (view) => set({ activeView: view }),
  setActiveProject: (id) =>
    set({
      activeProjectId: id,
      activeBookId: null,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
      selectedEventId: null,
      selectedLocationId: null,
    }),
  setActiveBook: (id) =>
    set({
      activeBookId: id,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
      selectedEventId: null,
      selectedLocationId: null,
    }),
  setSelectedChapter: (id) =>
    set({ selectedChapterId: id, selectedSceneId: null }),
  setSelectedScene: (id) =>
    set({ selectedSceneId: id, activeView: "manuscript" }),
  setSelectedCharacter: (id) =>
    set({ selectedCharacterId: id, activeView: "characters" }),
  setSelectedEvent: (id) =>
    set({ selectedEventId: id, activeView: "timeline" }),
  setSelectedLocation: (id) =>
    set({ selectedLocationId: id, activeView: "locations" }),
}));