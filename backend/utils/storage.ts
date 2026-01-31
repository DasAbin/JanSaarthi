import path from "path";
import fs from "fs/promises";

export function storageRoot(): string {
  // Backend runs with cwd = backend/
  return path.join(process.cwd(), "storage");
}

export function storagePath(...parts: string[]): string {
  return path.join(storageRoot(), ...parts);
}

export async function ensureStorageDirs(): Promise<void> {
  const dirs = [
    storagePath("pdfs"),
    storagePath("forms"),
    storagePath("audio"),
    storagePath("knowledge"),
    storagePath("knowledge", "modules"),
    storagePath("temp"),
    storagePath("chroma"),
    storagePath("cache"),
    storagePath("voices")
  ];
  await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));
}

