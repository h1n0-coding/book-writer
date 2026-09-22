import { appDataDir, join } from "@tauri-apps/api/path";
import { copyFile, mkdir, exists } from "@tauri-apps/plugin-fs";

export async function backupDatabase(): Promise<string> {
  const dataDir = await appDataDir();
  const backupsDir = await join(dataDir, "backups");

  if (!(await exists(backupsDir))) {
    await mkdir(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sourcePath = await join(dataDir, "bookwriter.db");
  const destPath = await join(backupsDir, `bookwriter-${timestamp}.db`);

  await copyFile(sourcePath, destPath);
  return destPath;
}