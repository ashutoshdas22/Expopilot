export type ExecutionStageStatus = "pending" | "in_progress" | "completed";

export type ExecutionStageKey =
  | "design_approval"
  | "artwork_received"
  | "material_planning"
  | "printing"
  | "fabrication"
  | "electrical_work"
  | "furniture"
  | "transport"
  | "installation"
  | "client_handover"
  | "dismantling";

export type ExecutionPlan = Record<ExecutionStageKey, ExecutionStageStatus>;

export const EXECUTION_STAGES: {
  key: ExecutionStageKey;
  label: string;
}[] = [
  { key: "design_approval", label: "Design approval" },
  { key: "artwork_received", label: "Artwork received" },
  { key: "material_planning", label: "Material planning" },
  { key: "printing", label: "Printing" },
  { key: "fabrication", label: "Fabrication" },
  { key: "electrical_work", label: "Electrical work" },
  { key: "furniture", label: "Furniture" },
  { key: "transport", label: "Transport" },
  { key: "installation", label: "Installation" },
  { key: "client_handover", label: "Client handover" },
  { key: "dismantling", label: "Dismantling" },
];

export const EXECUTION_STATUS_LABELS: Record<ExecutionStageStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

export function createDefaultExecutionPlan(): ExecutionPlan {
  return EXECUTION_STAGES.reduce((acc, stage) => {
    acc[stage.key] = "pending";
    return acc;
  }, {} as ExecutionPlan);
}

export function computeExecutionProgress(plan: ExecutionPlan): number {
  const total = EXECUTION_STAGES.length;
  let score = 0;
  for (const stage of EXECUTION_STAGES) {
    const status = plan[stage.key];
    if (status === "completed") score += 1;
    else if (status === "in_progress") score += 0.5;
  }
  return Math.round((score / total) * 100);
}

export function countExecutionByStatus(plan: ExecutionPlan): {
  pending: number;
  in_progress: number;
  completed: number;
} {
  const counts = { pending: 0, in_progress: 0, completed: 0 };
  for (const stage of EXECUTION_STAGES) {
    counts[plan[stage.key]] += 1;
  }
  return counts;
}
