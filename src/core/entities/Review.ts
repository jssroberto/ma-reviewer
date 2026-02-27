export type ChecklistStatus = "Sí" | "No" | "N/A";

export interface Finding {
  itemId: string;
  status: ChecklistStatus;
  finding: string;
  evidence?: string;
}

export interface ReviewSession {
  id: string;
  timestamp: string;
  driver: string;
  findings: Finding[];
}
