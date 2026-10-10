"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  MapPin,
  Receipt,
  Ruler,
  Wallet,
} from "lucide-react";
import { useProjects } from "@/components/project/project-provider";
import { ProjectAssistant } from "@/components/assistant/project-assistant";
import { NextStepCard } from "@/components/workflow/next-step-card";
import { WorkflowStrip } from "@/components/workflow/workflow-strip";
import { computeStallAreas, formatAreaSqM } from "@/lib/client-brief";
import { computeCostingTotals } from "@/lib/costing";
import { formatInr } from "@/lib/dashboard-data";
import { computeExecutionProgress } from "@/lib/execution";
import { buildClientQuotation, computeQuotationSummary } from "@/lib/quotation";
import { countBriefGaps, projectDisplayTitle } from "@/lib/project-store";
import { analyzeClientBrief } from "@/lib/brief-analysis";

const actionLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400";

export function DashboardView() {
  const { activeProject } = useProjects();
  if (!activeProject) return null;

  const brief = activeProject.brief;
  const areas = computeStallAreas(brief);
  const costing = computeCostingTotals(activeProject.costingLines);
  const quote = buildClientQuotation(activeProject.costingLines);
  const discount =
    Number(activeProject.quotationMeta.discountInr.replace(/,/g, "")) || 0;
  const quoteTotals = computeQuotationSummary(quote.subtotal, discount);
  const executionPercent = computeExecutionProgress(activeProject.execution);
  const missingCount = countBriefGaps(activeProject);
  const missingItems = analyzeClientBrief(brief).missing.slice(0, 3);

  const budget = Number(brief.clientBudget.replace(/,/g, "").trim()) || 0;
  const stallSize =
    brief.stallLengthM && brief.stallWidthM
      ? `${brief.stallLengthM} m × ${brief.stallWidthM} m`
      : "—";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Active job:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {projectDisplayTitle(activeProject)}
          </span>
        </p>
      </header>

      <WorkflowStrip />
      <NextStepCard />

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/client-brief"
            className={`${actionLinkClass} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900`}
          >
            <ClipboardList className="h-4 w-4" aria-hidden />
            Client brief
            <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
          </Link>
          <Link
            href="/costing"
            className={`${actionLinkClass} border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50`}
          >
            <Receipt className="h-4 w-4" aria-hidden />
            Costing
          </Link>
          <Link
            href="/quotation"
            className={`${actionLinkClass} border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50`}
          >
            <FileText className="h-4 w-4" aria-hidden />
            Quotation
          </Link>
          <Link
            href="/execution"
            className={`${actionLinkClass} border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50`}
          >
            Execution
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stall size" value={stallSize} icon={Ruler} />
        <StatCard
          label="Open sides"
          value={brief.openSides || "—"}
          icon={MapPin}
        />
        <StatCard
          label="Client budget"
          value={budget > 0 ? formatInr(budget) : "—"}
          icon={Wallet}
        />
        <StatCard
          label="Quote (incl. GST)"
          value={formatInr(quoteTotals.grandTotal)}
          icon={FileText}
        />
      </div>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Project progress
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Execution {executionPercent}% · Brief gaps {missingCount} · Selling{" "}
          {formatInr(costing.sellingTotal)}
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
            style={{ width: `${executionPercent}%` }}
          />
        </div>
        {areas.floorAreaSqM !== null ? (
          <p className="mt-2 text-xs text-zinc-500">
            Floor area {formatAreaSqM(areas.floorAreaSqM)}
          </p>
        ) : null}
      </section>

      {missingCount > 0 ? (
        <section
          className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 dark:border-amber-900/40 dark:bg-amber-950/20"
        >
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Missing brief requirements
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {missingItems.map((m) => (
              <li key={m.id}>• {m.title}</li>
            ))}
          </ul>
          <Link
            href="/client-brief"
            className="mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            Review client brief
          </Link>
        </section>
      ) : null}

      <ProjectAssistant />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
        <Icon className="h-5 w-5 text-zinc-500" aria-hidden />
      </div>
    </div>
  );
}
