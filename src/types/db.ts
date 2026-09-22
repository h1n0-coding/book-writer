import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const BookSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Book = z.infer<typeof BookSchema>;

export const ChapterStatusSchema = z.enum(["draft", "in_progress", "done"]);
export type ChapterStatus = z.infer<typeof ChapterStatusSchema>;

export const ChapterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string().min(1),
  sortOrder: z.number(),
  synopsis: z.string(),
  status: ChapterStatusSchema,
  targetWordCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string().min(1),
  sortOrder: z.number(),
  content: z.string(),
  synopsis: z.string(),
  povCharacterId: z.string().nullable(),
  locationId: z.string().nullable(),
  status: ChapterStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  age: z.number().nullable(),
  occupation: z.string(),
  goals: z.string(),
  fears: z.string(),
  secrets: z.string(),
  notes: z.string(),
  aliases: z.string(),
  role: z.string(),
  appearance: z.string(),
  personality: z.string(),
  backstory: z.string(),
  arcBeginning: z.string(),
  arcMiddle: z.string(),
  arcEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CharacterFieldSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  name: z.string().min(1),
  value: z.string(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CharacterField = z.infer<typeof CharacterFieldSchema>;

export const LocationSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Location = z.infer<typeof LocationSchema>;

export const EventSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  dateValue: z.string(),
  chapterId: z.string().nullable(),
  sortOrder: z.number(),
  status: ChapterStatusSchema,
  positionX: z.number(),
  positionY: z.number(),
  positionSet: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Event = z.infer<typeof EventSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const CharacterRelationshipSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  fromCharacterId: z.string(),
  toCharacterId: z.string(),
  type: z.string().min(1),
  description: z.string(),
  strength: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CharacterRelationship = z.infer<typeof CharacterRelationshipSchema>;

export const EventRelationSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  fromEventId: z.string(),
  toEventId: z.string(),
  type: z.string().min(1),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EventRelation = z.infer<typeof EventRelationSchema>;