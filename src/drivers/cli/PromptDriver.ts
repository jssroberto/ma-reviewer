export interface PromptDriver {
  collectUserStory(): Promise<{
    userStory: string;
    acceptanceCriteria: string;
  }>;
  selectStandards(availableFiles: string[]): Promise<string>;
  selectBranches(branches: string[]): Promise<string[]>;
  selectBaseBranch(
    branches: string[],
    defaultCandidate?: string,
  ): Promise<string>;
  selectScope(): Promise<"frontend" | "backend" | "both">;
  confirmReuse(featureName: string): Promise<boolean>;
  confirmReuseStandards(fileName: string): Promise<boolean>;
}
