import { analyzeClientBrief } from "@/lib/brief-analysis";
import { computeCostingTotals, computeLineCost } from "@/lib/costing";
import {
  computeExecutionProgress,
  EXECUTION_STAGES,
} from "@/lib/execution";
import { buildClientQuotation, computeQuotationSummary } from "@/lib/quotation";
import { countBriefGaps, projectDisplayTitle, type ExpoProject } from "@/lib/project-store";
import { formatInr } from "@/lib/dashboard-data";

export type AssistantInsight = {
  id: string;
  title: string;
  detail: string;
  tone: "neutral" | "warning" | "success" | "private";
};

export type ProjectAssistantReport = {
  summary: string;
  insights: AssistantInsight[];
};

export function buildProjectAssistantReport(
  project: ExpoProject,
): ProjectAssistantReport {
  const insights: AssistantInsight[] = [];
  const title = projectDisplayTitle(project);
  const gaps = analyzeClientBrief(project.brief).missing;
  const costing = computeCostingTotals(project.costingLines);
  const quote = buildClientQuotation(project.costingLines);
  const discount = Number(project.quotationMeta.discountInr.replace(/,/g, "")) || 0;
  const quoteSummary = computeQuotationSummary(quote.subtotal, discount);
  const executionPercent = computeExecutionProgress(project.execution);

  if (gaps.length > 0) {
    insights.push({
      id: "missing-brief",
      title: "Missing client information",
      detail: `${gaps.length} items need follow-up (e.g. ${gaps[0]?.title ?? "details"}).`,
      tone: "warning",
    });
  }

  const pendingStages = EXECUTION_STAGES.filter(
    (s) => project.execution[s.key] === "pending",
  );
  const inProgressStages = EXECUTION_STAGES.filter(
    (s) => project.execution[s.key] === "in_progress",
  );

  if (inProgressStages.length > 0) {
    insights.push({
      id: "execution-active",
      title: "Execution in progress",
      detail: inProgressStages.map((s) => s.label).join(", "),
      tone: "neutral",
    });
  } else if (pendingStages.length > 0) {
    insights.push({
      id: "execution-pending",
      title: "Pending execution work",
      detail: `Next up: ${pendingStages[0].label}.`,
      tone: "warning",
    });
  }

  const ranked = project.costingLines
    .map((line) => ({
      line,
      selling: computeLineCost(line).sellingAmount ?? 0,
    }))
    .filter((item) => item.selling > 0)
    .sort((a, b) => b.selling - a.selling);

  if (ranked[0]) {
    insights.push({
      id: "top-cost",
      title: "Highest-value line item",
      detail: `${ranked[0].line.description || "Service"} at ${formatInr(ranked[0].selling)} selling.`,
      tone: "neutral",
    });
  }

  insights.push({
    id: "profitability",
    title: "Project profitability (private)",
    detail: `Internal ${formatInr(costing.internalTotal)} → selling ${formatInr(costing.sellingTotal)} (${costing.marginPercent?.toFixed(1) ?? "0"}% margin). Client quote grand total ${formatInr(quoteSummary.grandTotal)} with GST.`,
    tone: "private",
  });

  const summary = `${title}: ${executionPercent}% execution complete, ${countBriefGaps(project)} brief gaps, client quote ${formatInr(quoteSummary.grandTotal)} (incl. GST).`;

  return { summary, insights };
}
