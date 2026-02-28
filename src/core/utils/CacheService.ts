import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface CacheData {
  story: string;
  criteria: string;
  featureName: string;
  standardsFile?: string;
}

export class CacheService {
  private readonly CACHE_FILE = path.join(
    os.homedir(),
    ".ma-reviewer-cache.json",
  );

  save(data: CacheData): void {
    try {
      if (!data.story) return;
      fs.writeFileSync(this.CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      // Silently ignore cache storage errors
    }
  }

  get(): CacheData | null {
    try {
      if (fs.existsSync(this.CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(this.CACHE_FILE, "utf-8"));
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  static generateFeatureName(story: string): string {
    return story.split("\n")[0]?.substring(0, 50).trim() || "Untitled";
  }
}
