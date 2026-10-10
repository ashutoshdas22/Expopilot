"use client";

import Link from "next/link";
import { FileText, Printer, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatInr } from "@/lib/dashboard-data";
import { emptyClientBrief } from "@/lib/client-brief";
import { sanitizeDecimalInput } from "@/lib/input-sanitize";
import {
  buildClientQuotation,
  computeQuotationSummary,
  formatQuotationDate,
  GST_RATE,
  PAYMENT_TERMS_TEXT,
  saveQuotationMeta,
  type QuotationMeta,
} from "@/lib/quotation";
import { NextStepCard } from "@/components/workflow/next-step-card";
import { useProjects } from "@/components/project/project-provider";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

function formatDisplayDate(iso: string): string {
  if (!iso.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stallSizeLabel(brief: typeof emptyClientBrief) {
  const l = brief.stallLengthM.trim();
  const w = brief.stallWidthM.trim();
  const h = brief.stallHeightM.trim();
  if (l && w && h) return `${l} m × ${w} m × ${h} m`;
  if (l && w) return `${l} m × ${w} m`;
  return "—";
}

export function QuotationPreview() {
  const { activeProject } = useProjects();
  const [meta, setMeta] = useState<QuotationMeta>({
    discountInr: "",
    notes: "",
  });
  const [quoteDate, setQuoteDate] = useState("");

  const brief = activeProject?.brief ?? emptyClientBrief;
  const quotation = useMemo(
    () =>
      activeProject
        ? buildClientQuotation(activeProject.costingLines)
        : { lines: [], subtotal: 0 },
    [activeProject],
  );

  const projectId = activeProject?.id;
  const metaHydratedRef = useRef(false);

  useEffect(() => {
    if (!projectId || !activeProject) return;
    metaHydratedRef.current = false;
    setMeta((prev) => {
      const next = activeProject.quotationMeta;
      if (prev.discountInr === next.discountInr && prev.notes === next.notes) {
        return prev;
      }
      return { ...next };
    });
    setQuoteDate(formatQuotationDate(new Date()));
    metaHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when switching projects
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !metaHydratedRef.current) return;
    const handle = window.setTimeout(() => {
      saveQuotationMeta(meta);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [meta, projectId]);

  function refreshFromCosting() {
    setQuoteDate(formatQuotationDate(new Date()));
  }

  const discountValue = useMemo(() => {
    const n = Number(meta.discountInr.replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
  }, [meta.discountInr]);

  const summary = useMemo(
    () => computeQuotationSummary(quotation.subtotal, discountValue),
    [quotation.subtotal, discountValue],
  );

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-8">
      <header className="no-print space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-800"
              aria-hidden
            >
              <FileText className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Client quotation
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Selling prices only — safe to share or print for your client.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refreshFromCosting}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh from costing
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      <div className="no-print">
        <NextStepCard />
      </div>

      <div className="no-print grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="quotation-discount"
          >
            Optional discount (INR)
          </label>
          <input
            id="quotation-discount"
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="0"
            value={meta.discountInr}
            onChange={(e) =>
              setMeta((prev) => ({
                ...prev,
                discountInr: sanitizeDecimalInput(e.target.value),
              }))
            }
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="quotation-notes"
          >
            Notes for client
          </label>
          <textarea
            id="quotation-notes"
            className={`${inputClass} min-h-[88px] resize-y`}
            placeholder="Validity, scope inclusions, site access, etc."
            value={meta.notes}
            onChange={(e) =>
              setMeta((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
      </div>

      {quotation.lines.length === 0 ? (
        <div
          className="no-print rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No quotation lines yet. Add services and selling prices in{" "}
            <Link
              href="/costing"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Measurements &amp; costing
            </Link>
            .
          </p>
        </div>
      ) : null}

      <article
        id="quotation-print"
        className="quotation-sheet mx-auto max-w-4xl rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:p-0 dark:border-zinc-800 dark:bg-zinc-900 print:dark:bg-white print:dark:text-zinc-900"
      >
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800 print:border-zinc-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold tracking-tight text-zinc-900 print:text-zinc-900 dark:text-zinc-50">
                Expo Pilot
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 print:text-zinc-600">
                Exhibition stall design &amp; fabrication
              </p>
            </div>
            <div className="text-left text-sm sm:text-right">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                Quotation
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 print:text-zinc-600">
                Date: {quoteDate || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Client details
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="text-zinc-500">Client</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                  {brief.clientName.trim() || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Exhibition details
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="text-zinc-500">Exhibition</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                  {brief.exhibitionName.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Venue</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
                  {brief.venue.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Booth / stall</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
                  {brief.boothNumber.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Stall size</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
                  {stallSizeLabel(brief)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Setup / dismantling</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
                  {formatDisplayDate(brief.setupDate)} —{" "}
                  {formatDisplayDate(brief.dismantlingDate)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Services &amp; rates
          </h2>
          {quotation.lines.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No services listed.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 print:border-zinc-300">
                    <th className="py-2 pr-4 font-medium">#</th>
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 pr-4 font-medium">Qty</th>
                    <th className="py-2 pr-4 font-medium">Unit</th>
                    <th className="py-2 pr-4 font-medium">Rate</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 print:divide-zinc-200">
                  {quotation.lines.map((line, index) => (
                    <tr key={line.id}>
                      <td className="py-3 pr-4 text-zinc-500">{index + 1}</td>
                      <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                        {line.description || "—"}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {line.quantity !== null
                          ? line.quantity.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                        {line.unitLabel}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {line.unitPrice !== null
                          ? formatInr(line.unitPrice)
                          : "—"}
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                        {line.amount !== null ? formatInr(line.amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 flex justify-end">
          <dl className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">Subtotal</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                {formatInr(summary.subtotal)}
              </dd>
            </div>
            {summary.discount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600 dark:text-zinc-400">Discount</dt>
                <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                  − {formatInr(summary.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">Amount before GST</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                {formatInr(summary.taxableAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">
                GST ({(GST_RATE * 100).toFixed(0)}% extra)
              </dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                {formatInr(summary.gstAmount)}
              </dd>
            </div>
            <div
              className="flex justify-between gap-4 border-t border-zinc-200 pt-2 dark:border-zinc-700 print:border-zinc-300"
            >
              <dt className="font-semibold text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                Grand total
              </dt>
              <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 print:text-zinc-900">
                {formatInr(summary.grandTotal)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800 print:border-zinc-300">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Payment terms
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
            {PAYMENT_TERMS_TEXT}
          </p>
        </section>

        {meta.notes.trim() ? (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Notes
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 print:text-zinc-800">
              {meta.notes.trim()}
            </p>
          </section>
        ) : null}

        <p className="mt-10 text-center text-xs text-zinc-500 print:text-zinc-500">
          Thank you for your business. For queries, contact your Expo Pilot project
          coordinator.
        </p>
      </article>
    </div>
  );
}
