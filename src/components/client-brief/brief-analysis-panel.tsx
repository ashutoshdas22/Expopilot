"use client";

import { CheckCircle2, ClipboardCopy, MessageCircleQuestion } from "lucide-react";
import { useMemo, useState } from "react";
import type { BriefAnalysisResult } from "@/lib/brief-analysis";

type BriefAnalysisPanelProps = {
  analysis: BriefAnalysisResult;
  hasSourceText: boolean;
};

export function BriefAnalysisPanel({
  analysis,
  hasSourceText,
}: BriefAnalysisPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const followUpMessage = useMemo(() => {
    if (analysis.missing.length === 0) return "";
    const lines = analysis.missing.map((m) => `• ${m.askClient}`);
    return `Hi,\n\nTo finalize your exhibition stall plan, could you please confirm:\n\n${lines.join("\n")}\n\nThank you!`;
  }, [analysis.missing]);

  async function copyQuestion(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  if (!hasSourceText) {
    return (
      <section
        className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6 dark:border-zinc-700 dark:bg-zinc-950/40"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Paste client requirements above to see organized details and missing
          information.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      aria-labelledby="brief-analysis-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="brief-analysis-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Brief analysis
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Important details pulled from your notes and form.{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {analysis.readyCount} of 9
            </span>{" "}
            checklist items found.
          </p>
        </div>
        {analysis.missing.length > 0 ? (
          <button
            type="button"
            onClick={() => copyQuestion("all", followUpMessage)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden />
            {copiedId === "all" ? "Copied!" : "Copy all questions"}
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Checklist complete
          </span>
        )}
      </div>

      {analysis.sections.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {analysis.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {section.title}
              </h3>
              <dl className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <div key={`${section.title}-${item.label}`}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {item.label}
                    </dt>
                    <dd className="text-sm text-zinc-800 dark:text-zinc-200">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No structured details detected yet — add stall sizes in the form or
          include clearer numbers in the pasted notes.
        </p>
      )}

      {analysis.missing.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Missing information
          </h3>
          <ul className="space-y-3">
            {analysis.missing.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.whyItMatters}
                </p>
                <div
                  className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <p className="flex gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <MessageCircleQuestion
                      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
                      aria-hidden
                    />
                    {item.askClient}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyQuestion(item.id, item.askClient)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
                    {copiedId === item.id ? "Copied" : "Copy question"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
