import { ReviewBranchChanges } from "../core/use-cases/ReviewBranchChanges.js";
import { CodexDriver } from "../drivers/ai/CodexDriver.js";
import { SimpleGitDriver } from "../drivers/git/SimpleGitDriver.js";
import { InquirerPromptDriver } from "../drivers/cli/InquirerPromptDriver.js";
import { CacheService } from "../core/utils/CacheService.js";
import { ConfigService } from "../core/utils/ConfigService.js";
import { ReviewSessionManager } from "../core/utils/ReviewSessionManager.js";
import { BrowserScriptPresenter } from "../presenters/BrowserScriptPresenter.js";
import { ConsolePresenter } from "../presenters/ConsolePresenter.js";
import { FeedbackPresenter } from "../presenters/FeedbackPresenter.js";
import { ReviewCommand } from "../commands/ReviewCommand.js";

export class Container {
  // Drivers
  private gitDriver = new SimpleGitDriver();
  private aiDriver = new CodexDriver();
  private promptDriver = new InquirerPromptDriver();

  // Utilities
  private cacheService = new CacheService();
  private configService = new ConfigService();

  // Use Cases
  private reviewUseCase = new ReviewBranchChanges(
    this.gitDriver,
    this.aiDriver,
  );

  // Presenters
  private browserPresenter = new BrowserScriptPresenter();
  private consolePresenter = new ConsolePresenter();
  private feedbackPresenter = new FeedbackPresenter();

  // Orchestrator
  private sessionManager = new ReviewSessionManager(
    this.gitDriver,
    this.promptDriver,
    this.cacheService,
    this.configService,
    this.reviewUseCase,
    this.consolePresenter,
    this.browserPresenter,
    this.feedbackPresenter,
  );

  resolveReviewSessionManager(): ReviewSessionManager {
    return this.sessionManager;
  }

  resolveReviewCommand(): ReviewCommand {
    return new ReviewCommand(this);
  }
}
