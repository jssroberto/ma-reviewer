import type { Container } from "../infrastructure/Container.js";

export interface ReviewCommandOptions {
  base?: string;
  driver?: string;
  userStory?: string;
  scope?: string;
}

export class ReviewCommand {
  constructor(private container: Container) {}

  async execute(options: ReviewCommandOptions): Promise<void> {
    const sessionManager = this.container.resolveReviewSessionManager();

    await sessionManager.run({
      userStoryFile: options.userStory,
      base: options.base,
      scope: options.scope,
    });
  }
}
