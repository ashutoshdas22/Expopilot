import { countBriefGaps, type ExpoProject } from "@/lib/project-store";
import { computeExecutionProgress, EXECUTION_STAGES } from "@/lib/execution";
import { computeCostingTotals } from "@/lib/costing";
import { buildClientQuotation } from "@/lib/quotation";

export type WorkflowStepId =
  | "brief"
  | "costing"
  | "quotation"
  | "execution"
  | "projects";

export type WorkflowStep = {
  id: WorkflowStepId;
  label: string;
  href: string;
  done: boolean;
};

export type NextStep = {
  title: string;
  href: string;
  reason: string;
};

export function getWorkflowSteps(project: ExpoProject): WorkflowStep[] {
  const briefReady =
    project.brief.clientName.trim() &&
    project.brief.exhibitionName.trim() &&
    countBriefGaps(project) <= 3;
  const costingReady = project.costingLines.some(
    (line) => line.sellingRate.trim() && line.description.trim(),
  );
  const quotationReady =
    buildClientQuotation(project.costingLines).subtotal > 0;
  const executionStarted = EXECUTION_STAGES.some(
    (s) => project.execution[s.key] !== "pending",
  );
  const executionDone = computeExecutionProgress(project.execution) >= 100;

  return [
    {
      id: "brief",
      label: "Client brief",
      href: "/client-brief",
      done: Boolean(briefReady),
    },
    {
      id: "costing",
      label: "Costing",
      href: "/costing",
      done: costingReady,
    },
    {
      id: "quotation",
      label: "Quotation",
      href: "/quotation",
      done: quotationReady,
    },
    {
      id: "execution",
      label: "Execution",
      href: "/execution",
      done: executionDone || executionStarted,
    },
    {
      id: "projects",
      label: "Projects",
      href: "/projects",
      done: true,
    },
  ];
}

export function getRecommendedNextStep(project: ExpoProject): NextStep {
  const gaps = countBriefGaps(project);
  if (!project.brief.clientName.trim() || gaps > 4) {
    return {
      title: "Complete client brief",
      href: "/client-brief",
      reason: "Capture client and stall details before costing.",
    };
  }
  if (gaps > 0) {
    return {
      title: "Resolve missing brief items",
      href: "/client-brief",
      reason: `${gaps} checklist items still need client confirmation.`,
    };
  }
  const totals = computeCostingTotals(project.costingLines);
  if (totals.sellingTotal <= 0) {
    return {
      title: "Build costing",
      href: "/costing",
      reason: "Add services with selling prices for the client quote.",
    };
  }
  const quoteSubtotal = buildClientQuotation(project.costingLines).subtotal;
  if (quoteSubtotal > 0 && project.quotationMeta.notes.trim() === "") {
    return {
      title: "Review client quotation",
      href: "/quotation",
      reason: "Check selling prices, GST, and payment terms before sharing.",
    };
  }
  const progress = computeExecutionProgress(project.execution);
  if (progress < 100) {
    const pending = EXECUTION_STAGES.find(
      (s) => project.execution[s.key] === "pending",
    );
    return {
      title: "Update execution plan",
      href: "/execution",
      reason: pending
        ? `Start or complete “${pending.label}”.`
        : "Track fabrication and site work.",
    };
  }
  return {
    title: "Save or duplicate project",
    href: "/projects",
    reason: "Archive this job and start the next exhibition.",
  };
}
