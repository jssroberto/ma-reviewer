import type { Finding } from "../entities/Review.js";

export class ManualReviewMiddleware {
  // Items that require visual/subjective human verification
  private static readonly MANUAL_FRONTEND_IDS = [
    1, 17, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30,
  ];

  static sanitize(findings: Finding[], scope?: string): Finding[] {
    return findings.map((finding) => {
      const idMatch = finding.itemId.match(/\d+/);
      if (!idMatch) return finding;

      const idNumber = parseInt(idMatch[0], 10);

      // If it's a visual item and we are in frontend scope, we force it to Manual status for human confirmation.
      // We avoid this for backend scope as the IDs overlap but have different meanings.
      if (scope !== "backend" && this.MANUAL_FRONTEND_IDS.includes(idNumber)) {
        return {
          ...finding,
          status: "Manual",
        };
      }

      return finding;
    });
  }
}
