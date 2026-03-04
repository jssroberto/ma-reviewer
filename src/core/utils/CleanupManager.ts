import * as fs from "fs";
import chalk from "chalk";

type CleanupAction = () => Promise<void>;

export class CleanupManager {
  private static instance: CleanupManager;
  private files: Set<string> = new Set();
  private actions: Map<string, CleanupAction> = new Map();
  private isCleaning = false;

  private constructor() {}

  static getInstance(): CleanupManager {
    if (!CleanupManager.instance) {
      CleanupManager.instance = new CleanupManager();
    }
    return CleanupManager.instance;
  }

  registerFile(filePath: string): void {
    this.files.add(filePath);
  }

  unregisterFile(filePath: string): void {
    this.files.delete(filePath);
  }

  registerAction(label: string, action: CleanupAction): void {
    this.actions.set(label, action);
  }

  unregisterAction(label: string): void {
    this.actions.delete(label);
  }

  async cleanup(): Promise<void> {
    if (this.isCleaning) return;
    this.isCleaning = true;

    // 1. Clean up registered files
    for (const file of this.files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (e: any) {
        // Silently fail to keep terminal clean
      }
    }
    this.files.clear();

    // 2. Clean up registered actions (like Git branches)
    for (const [label, action] of this.actions) {
      try {
        await action();
      } catch (e: any) {
        // Silently fail to keep terminal clean
      }
    }
    this.actions.clear();

    this.isCleaning = false;
  }
}
