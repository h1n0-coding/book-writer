import { getDb } from "../client";
import { Project, ProjectSchema } from "../../types/db";

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return ProjectSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function createProject(name: string): Promise<Project> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    "INSERT INTO projects (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)",
    [id, name, now, now],
  );

  return { id, name, createdAt: now, updatedAt: now };
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    "SELECT id, name, created_at, updated_at FROM projects ORDER BY created_at DESC",
  );
  return rows.map(mapRow);
}