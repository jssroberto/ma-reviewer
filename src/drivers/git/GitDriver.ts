export interface GitContext {
  diff: string;
  changedFiles: string[];
}

export interface GitDriver {
  getDiff(baseBranch: string | null): Promise<GitContext>;
}
