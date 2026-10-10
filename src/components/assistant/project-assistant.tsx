"use client";

import { Lock, Sparkles } from "lucide-react";
import { useProjects } from "@/components/project/project-provider";
import { buildProjectAssistantReport } from "@/lib/project-assistant";

export function ProjectAssistant() {
  const { activeProject } = useProjects();
  if (!activeProject) return null;

  const report = buildProjectAssistantReport(activeProject);

  return (
    <section
      className="no-print rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      aria-labelledby="project-assistant-heading"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-zinc-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2
            id="project-assistant-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Project assistant
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Rule-based insights from your saved project data — not generative AI.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {report.summary}
          </p>
          <ul className="mt-4 space-y-2">
            {report.insights.map((item) => (
              <li
                key={item.id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  item.tone === "private"
                    ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                    : item.tone === "warning"
                      ? "border-amber-200/60 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10"
                      : "border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50"
                }`}
              >
                <p className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-50">
                  {item.tone === "private" ? (
                    <Lock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
                  ) : null}
                  {item.title}
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
