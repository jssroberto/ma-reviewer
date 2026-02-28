import {
  GENERIC_STANDARDS_INSTRUCTION,
  RECOMMENDED_BASE_BRANCHES,
} from "../../config/defaults.js";

export class ConfigService {
  getGenericStandardsInstruction(): string {
    return GENERIC_STANDARDS_INSTRUCTION;
  }

  getRecommendedBaseBranches(): string[] {
    return RECOMMENDED_BASE_BRANCHES;
  }
}
