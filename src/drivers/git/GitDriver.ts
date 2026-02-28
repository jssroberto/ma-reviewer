export interface GitContext {
  diff: string;
  changedFiles: string[];
}

export interface GitDriver {
  getDiff(
    baseBranch: string | null,
    targetBranches: string[],
  ): Promise<GitContext>;
  listBranches(): Promise<string[]>;
}
