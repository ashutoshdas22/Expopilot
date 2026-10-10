"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProjects } from "@/components/project/project-provider";
import { getRecommendedNextStep } from "@/lib/workflow";

export function NextStepCard() {
  const { activeProject } = useProjects();
  if (!activeProject) return null;

  const next = getRecommendedNextStep(activeProject);

  return (
    <section
      className="no-print rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Suggested next step
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {next.reason}
      </p>
      <Link
        href={next.href}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {next.title}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
