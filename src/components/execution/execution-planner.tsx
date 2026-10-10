"use client";

import { useProjects } from "@/components/project/project-provider";
import {
  EXECUTION_STAGES,
  EXECUTION_STATUS_LABELS,
  computeExecutionProgress,
  type ExecutionStageStatus,
} from "@/lib/execution";
import { getActiveProject, updateActiveProject } from "@/lib/project-store";
import { NextStepCard } from "@/components/workflow/next-step-card";
import { WorkflowStrip } from "@/components/workflow/workflow-strip";

const selectClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function ExecutionPlanner() {
  const { activeProject, refresh } = useProjects();
  if (!activeProject) return null;

  const progress = computeExecutionProgress(activeProject.execution);

  function setStageStatus(
    key: (typeof EXECUTION_STAGES)[number]["key"],
    status: ExecutionStageStatus,
  ) {
    const current = getActiveProject();
    if (!current) return;
    updateActiveProject({
      execution: {
        ...current.execution,
        [key]: status,
      },
    });
    refresh();
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Execution planner
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Track each production and site stage. Overall progress updates
          automatically.
        </p>
      </header>

      <WorkflowStrip />
      <NextStepCard />

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Overall project progress
            </p>
            <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {progress}%
            </p>
          </div>
          <div
            className="h-3 w-full max-w-md overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXECUTION_STAGES.map((stage) => (
          <div
            key={stage.key}
            className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <label
              className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
              htmlFor={`stage-${stage.key}`}
            >
              {stage.label}
            </label>
            <select
              id={`stage-${stage.key}`}
              className={selectClass}
              value={activeProject.execution[stage.key]}
              onChange={(e) =>
                setStageStatus(
                  stage.key,
                  e.target.value as ExecutionStageStatus,
                )
              }
            >
              {(
                Object.entries(EXECUTION_STATUS_LABELS) as [
                  ExecutionStageStatus,
                  string,
                ][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
