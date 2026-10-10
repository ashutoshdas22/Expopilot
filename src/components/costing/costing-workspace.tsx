"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { computeStallAreas } from "@/lib/client-brief";
import { NextStepCard } from "@/components/workflow/next-step-card";
import {
  CALCULATION_TYPE_LABELS,
  computeCostingTotals,
  computeLineCost,
  createEmptyLine,
  createLineFromService,
  EXHIBITION_SERVICES,
  type CostCalculationType,
  type CostLineItem,
  type ExhibitionServiceTemplate,
} from "@/lib/costing";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/input-sanitize";
import { saveActiveCostingLines } from "@/lib/project-store";
import { useProjects } from "@/components/project/project-provider";
import { formatInr } from "@/lib/dashboard-data";

const labelClass =
  "block text-xs font-medium text-zinc-600 dark:text-zinc-400";
const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

export function CostingWorkspace() {
  const { activeProject } = useProjects();
  const [lines, setLines] = useState<CostLineItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!activeProject) return;
    setLines(activeProject.costingLines);
    setHydrated(true);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!hydrated) return;
    saveActiveCostingLines(lines);
  }, [lines, hydrated]);

  const briefHint = useMemo(() => {
    if (!activeProject) return null;
    const areas = computeStallAreas(activeProject.brief);
    if (areas.mainWallAreaSqM === null) return null;
    const { stallLengthM, stallHeightM } = activeProject.brief;
    return `From client brief: main wall ${stallLengthM} m × ${stallHeightM} m = ${areas.mainWallAreaSqM} m²`;
  }, [activeProject]);

  const totals = useMemo(() => computeCostingTotals(lines), [lines]);

  function updateLine(id: string, patch: Partial<CostLineItem>) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function updateDecimal(
    id: string,
    key: keyof CostLineItem,
    value: string,
  ) {
    updateLine(id, { [key]: sanitizeDecimalInput(value) } as Partial<CostLineItem>);
  }

  function addLine() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function addService(service: ExhibitionServiceTemplate) {
    setLines((prev) => [...prev, createLineFromService(service)]);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Measurements &amp; costing
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Add exhibition services, enter internal cost and client selling price
          for each line. Totals and margin update instantly.
        </p>
        {briefHint ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">{briefHint}</p>
        ) : null}
      </header>

      <NextStepCard />

      <div
        className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300"
      >
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-medium">Fabricator only.</span> Internal cost,
          profit, and margin stay on this page. The client quotation shows only
          descriptions and selling prices.
        </p>
      </div>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Common exhibition services
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Click to add a line with default rates — adjust measurements and prices
          as needed.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXHIBITION_SERVICES.map((service) => (
            <button
              key={service.key}
              type="button"
              onClick={() => addService(service)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              + {service.label}
            </button>
          ))}
        </div>
      </section>

      {lines.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No costing lines yet. Add a service above or start with a custom line.
          </p>
          <button
            type="button"
            onClick={addLine}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add first line
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {lines.map((line, index) => {
          const computed = computeLineCost(line);
          const lineProfit =
            computed.internalAmount !== null &&
            computed.sellingAmount !== null
              ? computed.sellingAmount - computed.internalAmount
              : null;

          return (
            <article
              key={line.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Line {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <label className={labelClass}>Service / description</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={line.description}
                    onChange={(e) =>
                      updateLine(line.id, { description: e.target.value })
                    }
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={labelClass}>Calculation</label>
                  <select
                    className={inputClass}
                    value={line.type}
                    onChange={(e) =>
                      updateLine(line.id, {
                        type: e.target.value as CostCalculationType,
                      })
                    }
                  >
                    {(
                      Object.entries(CALCULATION_TYPE_LABELS) as [
                        CostCalculationType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  {line.type === "area" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Length (m)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputClass}
                          value={line.dimensionAM}
                          onChange={(e) =>
                            updateDecimal(line.id, "dimensionAM", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Height / width (m)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputClass}
                          value={line.dimensionBM}
                          onChange={(e) =>
                            updateDecimal(line.id, "dimensionBM", e.target.value)
                          }
                        />
                      </div>
                      <p className="col-span-2 text-xs text-zinc-500">
                        {computed.measureLabel}
                      </p>
                    </div>
                  ) : null}

                  {line.type === "running_meter" ? (
                    <div>
                      <label className={labelClass}>Length (running m)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass}
                        value={line.dimensionAM}
                        onChange={(e) =>
                          updateDecimal(line.id, "dimensionAM", e.target.value)
                        }
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        {computed.measureLabel}
                      </p>
                    </div>
                  ) : null}

                  {line.type === "quantity" ? (
                    <p className="mt-6 text-xs text-zinc-500">
                      Enter quantity below (numbers of units).
                    </p>
                  ) : null}

                  {line.type === "fixed" ? (
                    <p className="mt-6 text-xs text-zinc-500">
                      Lump-sum internal cost and selling price below.
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 lg:col-span-3">
                  {line.type !== "fixed" ? (
                    <div>
                      <label className={labelClass}>
                        Quantity ({computed.unitLabel})
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass}
                        placeholder={
                          computed.measure !== null
                            ? String(computed.measure)
                            : ""
                        }
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: sanitizeDecimalInput(e.target.value),
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div aria-hidden />
                  )}

                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>
                        Internal cost
                        {line.type === "fixed" ? " (INR)" : " rate (INR)"}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`${inputClass} border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20`}
                        value={line.internalRate}
                        onChange={(e) =>
                          updateDecimal(line.id, "internalRate", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Selling price
                        {line.type === "fixed" ? " (INR)" : " rate (INR)"}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass}
                        value={line.sellingRate}
                        onChange={(e) =>
                          updateDecimal(line.id, "sellingRate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 grid gap-2 rounded-xl bg-zinc-50 px-4 py-3 sm:grid-cols-3 dark:bg-zinc-950/50"
                aria-live="polite"
              >
                <div>
                  <p className="text-xs text-zinc-500">Internal cost</p>
                  <p className="font-semibold tabular-nums text-amber-900 dark:text-amber-200">
                    {computed.internalAmount !== null
                      ? formatInr(computed.internalAmount)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Client selling value</p>
                  <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {computed.sellingAmount !== null
                      ? formatInr(computed.sellingAmount)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Line profit</p>
                  <p className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                    {lineProfit !== null ? formatInr(lineProfit) : "—"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add custom line
        </button>

        <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Total internal cost"
            value={formatInr(totals.internalTotal)}
            private
          />
          <SummaryCard
            label="Client selling value"
            value={formatInr(totals.sellingTotal)}
          />
          <SummaryCard
            label="Expected profit"
            value={formatInr(totals.profit)}
            private
            highlight="profit"
          />
          <SummaryCard
            label="Profit margin"
            value={
              totals.marginPercent !== null
                ? `${totals.marginPercent.toFixed(1)}%`
                : "—"
            }
            private
            highlight="profit"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  private: isPrivate,
  highlight,
}: {
  label: string;
  value: string;
  private?: boolean;
  highlight?: "profit";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm ${
        isPrivate
          ? "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {isPrivate ? <Lock className="h-3 w-3" aria-hidden /> : null}
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${
          highlight === "profit"
            ? "text-emerald-800 dark:text-emerald-300"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
