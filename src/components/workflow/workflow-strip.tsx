"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useProjects } from "@/components/project/project-provider";
import { getWorkflowSteps } from "@/lib/workflow";

export function WorkflowStrip() {
  const { activeProject } = useProjects();
  if (!activeProject) return null;

  const steps = getWorkflowSteps(activeProject);

  return (
    <nav
      className="no-print rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Expo Pilot workflow"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Workflow
      </p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                step.done
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {step.done ? <Check className="h-3 w-3" aria-hidden /> : null}
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
