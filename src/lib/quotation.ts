import { emptyClientBrief, type ClientBriefFields } from "@/lib/client-brief";
import {
  computeLineCost,
  getEffectiveMeasure,
  parseCostNumber,
  type CostLineItem,
} from "@/lib/costing";
import {
  getActiveProject,
  saveActiveQuotationMeta,
  type QuotationMeta,
} from "@/lib/project-store";

/** Client-facing quotation line — no internal cost or margin fields. */
export type ClientQuotationLine = {
  id: string;
  description: string;
  quantity: number | null;
  unitLabel: string;
  unitPrice: number | null;
  amount: number | null;
};

export type ClientQuotation = {
  lines: ClientQuotationLine[];
  subtotal: number;
};

export type { QuotationMeta } from "@/lib/project-store";

export const QUOTATION_META_STORAGE_KEY = "expo-pilot-quotation-meta";

export const GST_RATE = 0.18;

export const PAYMENT_TERMS_TEXT =
  "75% advance payment against confirmation of this quotation. Balance 25% payable on site before handover of the stall.";

export type QuotationSummary = {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
};

export function toClientQuotationLine(line: CostLineItem): ClientQuotationLine {
  const computed = computeLineCost(line);
  const quantity = line.type === "fixed" ? 1 : getEffectiveMeasure(line);

  return {
    id: line.id,
    description: line.description,
    quantity,
    unitLabel: computed.unitLabel,
    unitPrice: parseCostNumber(line.sellingRate),
    amount: computed.sellingAmount,
  };
}

export function buildClientQuotation(lines: CostLineItem[]): ClientQuotation {
  const clientLines = lines
    .filter((line) => line.description.trim() || line.sellingRate.trim())
    .map(toClientQuotationLine);

  const subtotal = clientLines.reduce(
    (sum, line) => sum + (line.amount ?? 0),
    0,
  );

  return { lines: clientLines, subtotal };
}

export function computeQuotationSummary(
  subtotal: number,
  discountInput: number,
): QuotationSummary {
  const discount = Math.min(Math.max(0, discountInput), subtotal);
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = Math.round(taxableAmount * GST_RATE * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    subtotal,
    discount,
    taxableAmount,
    gstAmount,
    grandTotal,
  };
}

export function loadClientQuotationFromStorage(): ClientQuotation {
  const project = getActiveProject();
  if (!project) {
    return { lines: [], subtotal: 0 };
  }
  return buildClientQuotation(project.costingLines);
}

export function loadClientBriefForQuotation(): ClientBriefFields {
  const project = getActiveProject();
  if (!project) return emptyClientBrief;
  return project.brief;
}

export function loadQuotationMeta(): QuotationMeta {
  const project = getActiveProject();
  if (!project) return { discountInr: "", notes: "" };
  return project.quotationMeta;
}

export function saveQuotationMeta(meta: QuotationMeta): void {
  if (typeof window === "undefined") return;
  saveActiveQuotationMeta(meta);
}

export function formatQuotationDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
