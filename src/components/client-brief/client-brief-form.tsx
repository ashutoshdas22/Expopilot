"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeStallAreas,
  emptyClientBrief,
  formatAreaSqM,
  type ClientBriefFields,
} from "@/lib/client-brief";
import { NextStepCard } from "@/components/workflow/next-step-card";
import { WorkflowStrip } from "@/components/workflow/workflow-strip";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/input-sanitize";
import { saveActiveBrief } from "@/lib/project-store";
import { useProjects } from "@/components/project/project-provider";
import { formatInr } from "@/lib/dashboard-data";
import { analyzeClientBrief } from "@/lib/brief-analysis";
import { BriefAnalysisPanel } from "@/components/client-brief/brief-analysis-panel";

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function ClientBriefForm() {
  const { activeProject } = useProjects();
  const [fields, setFields] = useState<ClientBriefFields>(emptyClientBrief);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [briefLoaded, setBriefLoaded] = useState(false);

  useEffect(() => {
    if (!activeProject) return;
    setFields(activeProject.brief);
    setBriefLoaded(true);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!activeProject || !briefLoaded) return;
    const handle = window.setTimeout(() => {
      saveActiveBrief(fields);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [fields, activeProject?.id, briefLoaded]);

  const areas = useMemo(() => computeStallAreas(fields), [fields]);

  const analysis = useMemo(() => analyzeClientBrief(fields), [fields]);

  const hasBriefContent = useMemo(() => {
    if (fields.pastedRequirements.trim().length > 0) return true;
    return (
      fields.clientName.trim() ||
      fields.exhibitionName.trim() ||
      fields.venue.trim() ||
      fields.boothNumber.trim() ||
      fields.stallLengthM.trim() ||
      fields.stallWidthM.trim() ||
      fields.stallHeightM.trim() ||
      fields.clientBudget.trim() ||
      fields.setupDate.trim()
    );
  }, [fields]);

  const budgetDisplay = useMemo(() => {
    const n = Number(fields.clientBudget.replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n < 0 || fields.clientBudget.trim() === "") {
      return null;
    }
    return formatInr(n);
  }, [fields.clientBudget]);

  function update<K extends keyof ClientBriefFields>(
    key: K,
    value: ClientBriefFields[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  function updateDecimal(key: keyof ClientBriefFields, value: string) {
    update(key, sanitizeDecimalInput(value));
  }

  function handleSave() {
    try {
      saveActiveBrief(fields);
      setSavedMessage("Brief saved to the active project.");
    } catch {
      setSavedMessage("Could not save — check browser storage settings.");
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Client brief
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Paste messages from WhatsApp, email, or call notes, then fill in the
          stall details. Analysis and areas update automatically as you type.
        </p>
      </header>

      <WorkflowStrip />
      <NextStepCard />

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Field
          label="Requirements from client (paste here)"
          hint="WhatsApp chats, emails, voice-note summaries, or site visit notes"
        >
          <textarea
            className={`${inputClass} min-h-[140px] resize-y`}
            placeholder="Paste client messages or type call notes…"
            value={fields.pastedRequirements}
            onChange={(e) => update("pastedRequirements", e.target.value)}
          />
        </Field>
      </section>

      <BriefAnalysisPanel
        analysis={analysis}
        hasSourceText={Boolean(hasBriefContent)}
      />

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Project details
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Client name">
            <input
              type="text"
              className={inputClass}
              autoComplete="organization"
              value={fields.clientName}
              onChange={(e) => update("clientName", e.target.value)}
            />
          </Field>
          <Field label="Exhibition name">
            <input
              type="text"
              className={inputClass}
              value={fields.exhibitionName}
              onChange={(e) => update("exhibitionName", e.target.value)}
            />
          </Field>
          <Field label="Venue">
            <input
              type="text"
              className={inputClass}
              value={fields.venue}
              onChange={(e) => update("venue", e.target.value)}
            />
          </Field>
          <Field label="Booth number">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Hall 5 — A-142"
              value={fields.boothNumber}
              onChange={(e) => update("boothNumber", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stall dimensions
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter sizes in metres. Wall area uses length × height (e.g. 12 m × 3 m
          = 36 m²).
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Stall length (m)">
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="12"
              value={fields.stallLengthM}
              onChange={(e) => updateDecimal("stallLengthM", e.target.value)}
            />
          </Field>
          <Field label="Stall width (m)">
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="3"
              value={fields.stallWidthM}
              onChange={(e) => updateDecimal("stallWidthM", e.target.value)}
            />
          </Field>
          <Field label="Stall height (m)">
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="3"
              value={fields.stallHeightM}
              onChange={(e) => updateDecimal("stallHeightM", e.target.value)}
            />
          </Field>
          <Field label="Number of open sides" hint="0–4 (front opens first)">
            <input
              type="number"
              min={0}
              max={4}
              className={inputClass}
              value={fields.openSides}
              onChange={(e) =>
                update("openSides", sanitizeIntegerInput(e.target.value))
              }
            />
          </Field>
        </div>

        <div
          className="mt-8 grid gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-950/50"
          aria-live="polite"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Floor area
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatAreaSqM(areas.floorAreaSqM)}
            </p>
            <p className="text-xs text-zinc-500">Length × width</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Main wall area
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatAreaSqM(areas.mainWallAreaSqM)}
            </p>
            <p className="text-xs text-zinc-500">Length × height</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Side wall (each)
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatAreaSqM(areas.sideWallAreaSqM)}
            </p>
            <p className="text-xs text-zinc-500">Width × height</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Total wall cladding
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatAreaSqM(areas.totalWallCladdingSqM)}
            </p>
            <p className="text-xs text-zinc-500">
              {areas.closedWallLengthM !== null
                ? `${areas.closedWallLengthM.toLocaleString("en-IN")} m closed run × height`
                : "Closed walls × height"}
            </p>
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Budget &amp; schedule
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Client budget (INR)">
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              placeholder="1850000"
              value={fields.clientBudget}
              onChange={(e) => updateDecimal("clientBudget", e.target.value)}
            />
            {budgetDisplay ? (
              <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {budgetDisplay}
              </p>
            ) : null}
          </Field>
          <Field label="Setup date">
            <input
              type="date"
              className={inputClass}
              value={fields.setupDate}
              onChange={(e) => update("setupDate", e.target.value)}
            />
          </Field>
          <Field label="Dismantling date">
            <input
              type="date"
              className={inputClass}
              value={fields.dismantlingDate}
              onChange={(e) => update("dismantlingDate", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save brief
        </button>
        {savedMessage ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
            {savedMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
