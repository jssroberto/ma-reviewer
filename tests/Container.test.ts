import { describe, it, expect } from "vitest";
import { Container } from "../src/infrastructure/Container.js";
import { ReviewSessionManager } from "../src/core/utils/ReviewSessionManager.js";

describe("Container", () => {
  const container = new Container();

  it("should resolve ReviewSessionManager", () => {
    const sessionManager = container.resolveReviewSessionManager();
    expect(sessionManager).toBeInstanceOf(ReviewSessionManager);
  });
});
