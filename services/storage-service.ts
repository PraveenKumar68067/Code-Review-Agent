import { promises as fs } from "fs";
import path from "path";

import { settings } from "@/config/settings";

export class StorageService {
  private dataDir = settings.dataDir;

  async readJson<T>(filename: string, fallback: T): Promise<T> {
    const fullPath = path.join(this.dataDir, filename);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async writeJson(filename: string, payload: unknown) {
    const fullPath = path.join(this.dataDir, filename);
    await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
  }

  async appendJsonItem<T>(filename: string, item: T) {
    const current = await this.readJson<T[]>(filename, []);
    current.push(item);
    await this.writeJson(filename, current);
  }

  async readSample(filename: string) {
    const fullPath = path.join(this.dataDir, "sample-code", filename);
    return fs.readFile(fullPath, "utf8");
  }
}
